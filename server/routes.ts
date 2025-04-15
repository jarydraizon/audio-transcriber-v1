import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { transcribeAudio } from "./transcription";
import { z } from "zod";
import { transcriptionSchema } from "@shared/schema";

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
    fileSize: 25 * 1024 * 1024, // 25MB
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
        // Transcribe the audio file
        const transcription = await transcribeAudio(filePath);
        
        // Validate the response
        const validatedTranscription = transcriptionSchema.parse({
          text: transcription.text,
          duration: transcription.duration,
          filename: req.file.originalname,
        });
        
        // Remove the temporary file
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        
        // Return the transcription
        return res.status(200).json(validatedTranscription);
      } catch (error: any) {
        // Remove the temporary file on error
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        
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
