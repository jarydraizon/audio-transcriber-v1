import fs from "fs";
import OpenAI from "openai";

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
});

/**
 * Transcribe an audio file using OpenAI's Whisper API
 * @param audioFilePath Path to the audio file
 * @returns Transcription result with text and duration
 */
export async function transcribeAudio(audioFilePath: string): Promise<{ text: string; duration: number }> {
  try {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error("Audio file not found");
    }

    // Create a readable stream from the audio file
    const audioReadStream = fs.createReadStream(audioFilePath);

    // Call the OpenAI API to transcribe the audio
    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  } catch (error: any) {
    // Log the error for debugging
    console.error("Error transcribing audio:", error);

    // Handle specific OpenAI API errors
    if (error.response && error.response.data) {
      const apiError = error.response.data;
      throw new Error(apiError.error?.message || "OpenAI API error");
    }

    // Re-throw with a more descriptive message
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}
