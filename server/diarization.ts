import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Interface for speaker segments in the transcript
 */
export interface SpeakerSegment {
  speaker: string;
  text: string;
}

/**
 * Identifies different speakers in a transcript and segments the text
 * @param transcriptText The raw transcript text
 * @returns Array of speaker segments with speaker identifier and text
 */
export async function identifySpeakers(transcriptText: string): Promise<SpeakerSegment[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert in conversation analysis and speaker identification. Your task is to analyze a transcript and identify different speakers.

- Identify speaker changes based on context, speech patterns, and conversation flow
- Assign each speaker a label (Speaker 1, Speaker 2, etc.)
- Format the output as a JSON array where each object contains a speaker identifier and their spoken text
- Preserve the chronological order of the conversation
- Split long monologues into reasonable segments if they continue for too long
- If you're unsure about a speaker change, err on the side of keeping it as the same speaker

Your response should be formatted as JSON with the following structure:
[
  { "speaker": "Speaker 1", "text": "First segment of text from speaker 1..." },
  { "speaker": "Speaker 2", "text": "Response from speaker 2..." },
  { "speaker": "Speaker 1", "text": "Next segment from speaker 1..." }
]`
        },
        {
          role: "user",
          content: `Please analyze this transcript and identify different speakers. Format the result as a JSON array of speaker segments:

${transcriptText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    // Parse the JSON response
    const content = response.choices[0].message.content;
    if (!content) {
      return [{ speaker: "Unknown", text: transcriptText }];
    }
    
    try {
      const result = JSON.parse(content);
      
      // Handle various possible response formats
      if (Array.isArray(result)) {
        return result;
      } else if (result.segments && Array.isArray(result.segments)) {
        return result.segments;
      } else if (result.speakers && Array.isArray(result.speakers)) {
        return result.speakers;
      } else {
        console.warn("Unexpected response format from diarization:", result);
        return [{ speaker: "Unknown", text: transcriptText }];
      }
    } catch (parseError) {
      console.error("Failed to parse diarization response:", parseError);
      return [{ speaker: "Unknown", text: transcriptText }];
    }
  } catch (error: any) {
    console.error("Error identifying speakers:", error);
    // In case of error, return the original text as a single segment
    return [{ speaker: "Unknown", text: transcriptText }];
  }
}