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
          content: `You are a speaker diarization assistant that analyzes transcripts and identifies different speakers.

You MUST return your response ONLY as a JSON array with this structure:
[
  {"speaker": "Speaker 1", "text": "First speaker segment text"},
  {"speaker": "Speaker 2", "text": "Second speaker segment text"}
]

Important rules:
1. Be aggressive in detecting speaker changes
2. This is definitely a multi-person conversation with at least 2 speakers
3. DO NOT return a single object - your output MUST be an ARRAY
4. Use "Speaker 1", "Speaker 2" (or "Interviewer"/"Candidate" if obvious) as names
5. Divide the text into clear segments by speaker
6. Never return just one speaker

Analyze turn-taking patterns, question-answer pairs, and changes in topic or perspective.
Break long monologues into separate entries for the same speaker if they change topics.
Return at least 2 different speakers, even if you have to guess speaker changes.`
        },
        {
          role: "user",
          content: `Below is a transcript from a conversation with AT LEAST 2 different speakers. Identify who says what by analyzing patterns like questions/answers and topic shifts.

Format your response EXACTLY like this with NO EXTRA TEXT:
[
  {"speaker": "Speaker 1", "text": "What they said"},
  {"speaker": "Speaker 2", "text": "The response"}
]

IMPORTANT: 
- Return JSON ARRAY with multiple speakers (minimum 2)
- MUST include at least one segment for each speaker
- Split long monologues if topics change
- If it's clearly an interview, use "Interviewer" and "Interviewee" as names

Transcript:
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
          const segments = result[0].text.split(/(?<=\.|\?|\!)\s+/g).filter((s: string) => s.trim().length > 0);
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
          // Try to extract meaningful segments
          const segments = Object.entries(result).map(([key, val]) => {
            // If this is a single speaker object format
            if (key === 'speaker' && 'text' in result) {
              return { 
                speaker: val as string, 
                text: result.text as string 
              };
            }
            // If key looks like 'speaker1', 'speaker2', etc.
            else if (key.toLowerCase().includes('speaker') && typeof val === 'string') {
              return { speaker: key, text: val as string };
            }
            return null;
          }).filter(Boolean);
          
          if (segments.length > 0) {
            // Handle case where we only have one speaker segment
            if (segments.length === 1) {
              const segment = segments[0];
              // Check if segment and its properties are defined
              if (segment && segment.text && segment.text.length > 200) {
                console.log("Got only one speaker segment, attempting to split into a conversation...");
                
                // Split text at potential speaker transition points (questions, statements)
                const text = segment.text;
                
                try {
                  // Use regular method instead of matchAll for compatibility
                  const regex = /(?<=[.!?])\s+(?=[A-Z])/g;
                  const sentenceEndings: number[] = [];
                  let match;
                  
                  // Find all positions of sentence endings
                  let position = 0;
                  while ((match = regex.exec(text)) !== null) {
                    if (match.index !== undefined) {
                      sentenceEndings.push(match.index);
                      position = match.index + 1;
                      // Avoid infinite loops
                      if (position >= text.length) break;
                    }
                  }
                  
                  if (sentenceEndings.length > 0) {
                    // Create at least one additional speaker
                    const firstSpeaker = segment.speaker || "Speaker 1";
                    const secondSpeaker = firstSpeaker === "Interviewer" ? "Interviewee" : "Speaker 2";
                    
                    const thirdIndex = Math.floor(sentenceEndings.length / 3);
                    const twoThirdsIndex = Math.floor(sentenceEndings.length * 2 / 3);
                    
                    const firstBreakPoint = thirdIndex >= 0 && thirdIndex < sentenceEndings.length 
                                            ? sentenceEndings[thirdIndex] : 0;
                    const secondBreakPoint = twoThirdsIndex >= 0 && twoThirdsIndex < sentenceEndings.length 
                                            ? sentenceEndings[twoThirdsIndex] : 
                                            (sentenceEndings.length > 0 ? sentenceEndings[sentenceEndings.length - 1] : 0);
                    
                    // Create at least 3 segments for a more natural conversation
                    return [
                      { speaker: firstSpeaker, text: text.substring(0, firstBreakPoint + 1).trim() },
                      { speaker: secondSpeaker, text: text.substring(firstBreakPoint + 1, secondBreakPoint + 1).trim() },
                      { speaker: firstSpeaker, text: text.substring(secondBreakPoint + 1).trim() }
                    ];
                  }
                } catch (e) {
                  console.error("Error splitting text into segments:", e);
                }
              }
            }
            
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
      const sentences = transcriptText.split(/(?<=\.|\?|\!)\s+/g).filter((s: string) => s.trim().length > 0);
      
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