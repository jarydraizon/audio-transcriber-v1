import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from 'child_process';
import { promisify } from 'util';
import { transcribeAudio } from "./transcription";
import { z } from "zod";
import { transcriptionSchema } from "@shared/schema";

// Promisify exec for easier async/await usage
const execAsync = promisify(exec);

/**
 * Compresses an audio file using FFmpeg to reduce its size
 * Uses Opus codec at low bitrate optimized for speech
 * @param inputPath Path to the original audio file
 * @returns Path to the compressed audio file
 */
async function compressAudioFile(inputPath: string): Promise<string> {
  const outputDir = path.dirname(inputPath);
  const outputPath = path.join(outputDir, `compressed-${path.basename(inputPath)}.ogg`);
  
  try {
    // Command based on the provided FFmpeg settings
    // -vn: No video
    // -map_metadata -1: Remove metadata
    // -ac 1: Convert to mono (1 audio channel)
    // -c:a libopus: Use Opus codec
    // -b:a 12k: Set bitrate to 12 kbps
    // -application voip: Optimize for voice
    const command = `ffmpeg -i "${inputPath}" -vn -map_metadata -1 -ac 1 -c:a libopus -b:a 12k -application voip "${outputPath}"`;
    
    // Execute FFmpeg command
    await execAsync(command);
    
    // Check if output file exists and has content
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error("Failed to compress audio: Output file is missing or empty");
    }
    
    // Delete the original file to save space
    fs.unlinkSync(inputPath);
    
    return outputPath;
  } catch (error) {
    console.error("Error compressing audio:", error);
    // If compression fails, return the original file path
    return inputPath;
  }
}

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "tmp", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Create unique filename with original extension
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB - we'll compress larger files
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    const allowedMimes = [
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/x-m4a",
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only MP3, WAV, and M4A files are allowed.") as any);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for transcribing audio
  app.post("/api/transcribe", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }
      
      const filePath = req.file.path;
      
      try {
        let audioPath = filePath;
        let wasCompressed = false;
        
        try {
          // Get file size in bytes
          const fileSize = fs.statSync(filePath).size;
          const maxWhisperFileSize = 25 * 1024 * 1024; // 25MB OpenAI limit
          
          // If file is larger than Whisper's limit, compress it
          if (fileSize > maxWhisperFileSize) {
            console.log(`Audio file is ${(fileSize / (1024 * 1024)).toFixed(2)}MB, compressing...`);
            audioPath = await compressAudioFile(filePath);
            wasCompressed = (audioPath !== filePath);
            
            // Check size after compression
            const newSize = fs.statSync(audioPath).size;
            console.log(`Compression complete. New size: ${(newSize / (1024 * 1024)).toFixed(2)}MB`);
            
            // If still too large, throw error
            if (newSize > maxWhisperFileSize) {
              throw new Error(`File still too large after compression (${(newSize / (1024 * 1024)).toFixed(2)}MB). Try a shorter audio clip.`);
            }
          }
          
          // Transcribe the audio file
          const transcription = await transcribeAudio(audioPath);
          
          // Validate the response
          const validatedTranscription = transcriptionSchema.parse({
            text: transcription.text,
            duration: transcription.duration,
            filename: req.file.originalname,
            wasCompressed: wasCompressed
          });
          
          // Return the transcription
          return res.status(200).json(validatedTranscription);
        } finally {
          // Clean up temp files in either case (success or error)
          if (fs.existsSync(audioPath)) {
            fs.unlink(audioPath, (err) => {
              if (err) console.error("Error removing temp file:", err);
            });
          }
          
          // If we created a new compressed file and the original still exists
          if (wasCompressed && fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) console.error("Error removing original file:", err);
            });
          }
        }
      } catch (error: any) {
        // Handle specific OpenAI API errors
        if (error.response && error.response.status) {
          const status = error.response.status;
          const message = error.response.data?.error?.message || "OpenAI API error";
          return res.status(status).json({ message });
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      return res.status(500).json({ message: error.message || "Failed to transcribe audio" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
