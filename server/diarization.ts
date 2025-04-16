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
          content: `You are an expert in conversation analysis and speaker diarization. Your task is to analyze a transcript of a conversation and accurately identify different speakers, even when no explicit speaker labels are provided.

IMPORTANT INSTRUCTIONS:
- Carefully analyze turn-taking patterns, question-answer pairs, and changes in topic or perspective
- Look for clear indicators of speaker changes like questions followed by answers or shifts in perspective
- Pay special attention to phrases like "thank you", "could you tell me", or any dialogue markers
- Label speakers as "Interviewer" and "Interviewee" if it's an interview format
- Otherwise label speakers as "Speaker 1", "Speaker 2", etc.
- Be aggressive in detecting speaker changes - conversations almost always have multiple speakers
- Format each speaker's text as a separate entry in a JSON array
- Break long monologues into separate entries for the same speaker if they change topics
- Use conversational context to determine speaker changes (e.g., questions followed by answers)
- It's critical to separate different speakers properly, even when there are no explicit speaker indicators
- Never return "Unknown" as the only speaker - make your best effort to identify at least 2 speakers

Your response MUST be formatted as valid JSON with the following structure:
[
  { "speaker": "Interviewer", "text": "Question asked by the interviewer..." },
  { "speaker": "Interviewee", "text": "Response from the interviewee..." },
  { "speaker": "Interviewer", "text": "Follow-up question..." }
]`
        },
        {
          role: "user",
          content: `Please analyze this conversation transcript and identify all the different speakers. The transcript doesn't have explicit speaker labels, so you need to infer the speaker changes from context, turn-taking patterns, and content. 

Separate each speaker's segments and format the result as a JSON array as specified. Remember to be aggressive in identifying different speakers - this is definitely a multi-person conversation:

${transcriptText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    // Parse the JSON response
    const content = response.choices[0].message.content;
    if (!content) {
      console.warn("Empty response from speaker identification");
      return [{ speaker: "Unknown", text: transcriptText }];
    }
    
    try {
      let result = JSON.parse(content);
      console.log("Speaker identification result:", JSON.stringify(result, null, 2));
      
      // Handle various possible response formats
      if (Array.isArray(result)) {
        // Ensure we have at least two speakers
        if (result.length === 1) {
          // Split the content to create at least two speakers
          const segments = result[0].text.split(/(?<=\.|\?|\!)\s+/g).filter(s => s.trim().length > 0);
          if (segments.length > 1) {
            const firstHalf = segments.slice(0, Math.ceil(segments.length/2)).join(" ");
            const secondHalf = segments.slice(Math.ceil(segments.length/2)).join(" ");
            return [
              { speaker: "Speaker 1", text: firstHalf },
              { speaker: "Speaker 2", text: secondHalf }
            ];
          }
        }
        return result;
      } else if (result.segments && Array.isArray(result.segments)) {
        return result.segments;
      } else if (result.speakers && Array.isArray(result.speakers)) {
        return result.speakers;
      } else {
        console.warn("Unexpected response format from diarization, attempting to parse:", result);
        // Try to convert object to array if needed
        if (typeof result === 'object') {
          const segments = Object.entries(result).map(([key, val]) => {
            // If key looks like 'speaker1', 'speaker2', etc.
            if (key.toLowerCase().includes('speaker') && typeof val === 'string') {
              return { speaker: key, text: val as string };
            }
            return null;
          }).filter(Boolean);
          
          if (segments.length > 0) {
            return segments as SpeakerSegment[];
          }
        }
        
        // Fallback: create two generic speakers by splitting the text
        const midPoint = Math.floor(transcriptText.length / 2);
        let splitIndex = transcriptText.indexOf('. ', midPoint);
        if (splitIndex === -1 || splitIndex > midPoint + 200) {
          splitIndex = midPoint;
        } else {
          splitIndex += 2; // Move past the period and space
        }
        
        return [
          { speaker: "Speaker 1", text: transcriptText.substring(0, splitIndex).trim() },
          { speaker: "Speaker 2", text: transcriptText.substring(splitIndex).trim() }
        ];
      }
    } catch (parseError) {
      console.error("Failed to parse diarization response:", parseError);
      // As a fallback, create segments by splitting at sentence boundaries
      const sentences = transcriptText.split(/(?<=\.|\?|\!)\s+/g).filter(s => s.trim().length > 0);
      
      if (sentences.length <= 2) {
        return [{ speaker: "Speaker 1", text: transcriptText }];
      }
      
      // Alternate sentences between two speakers
      const segments: SpeakerSegment[] = [];
      let currentSpeaker = "Speaker 1";
      let currentText = sentences[0];
      
      for (let i = 1; i < sentences.length; i++) {
        // Detect possible speaker changes based on question marks or key phrase indicators
        const prevSentence = sentences[i-1];
        const currSentence = sentences[i];
        
        // Change speaker if previous sentence ended with a question or contains certain phrases
        const speakerChangeIndicators = [
          prevSentence.endsWith('?'),
          prevSentence.includes('thank you'),
          prevSentence.includes('could you'),
          prevSentence.includes('what do you think'),
          currSentence.includes('yeah'),
          currSentence.includes('okay'),
          currSentence.includes('so,'),
          currSentence.includes('well,')
        ];
        
        if (speakerChangeIndicators.some(indicator => indicator)) {
          segments.push({ speaker: currentSpeaker, text: currentText });
          currentSpeaker = currentSpeaker === "Speaker 1" ? "Speaker 2" : "Speaker 1";
          currentText = currSentence;
        } else {
          currentText += " " + currSentence;
        }
      }
      
      // Add the last segment
      segments.push({ speaker: currentSpeaker, text: currentText });
      return segments;
    }
  } catch (error: any) {
    console.error("Error identifying speakers:", error);
    // In case of error, return the original text as a single segment
    return [{ speaker: "Unknown", text: transcriptText }];
  }
}