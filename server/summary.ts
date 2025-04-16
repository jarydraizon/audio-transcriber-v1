import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a structured summary of the transcript using OpenAI's GPT model
 * @param transcriptText The full transcript text to summarize
 * @returns A structured summary with key points, topics, and action items
 */
export async function generateSummary(transcriptText: string): Promise<{
  keyPoints: string[];
  topics: { topic: string; description: string }[];
  actionItems?: string[];
}> {
  try {
    // Define the prompt for GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert summarizer. Extract key information from transcripts and organize them into a clear, structured format. Be concise but comprehensive. 
          
Your response should be formatted in JSON with the following structure:
{
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "topics": [
    { "topic": "Topic Name 1", "description": "Brief description of topic 1" },
    { "topic": "Topic Name 2", "description": "Brief description of topic 2" }
  ],
  "actionItems": ["action 1", "action 2"] // optional, only if actions are mentioned
}`
        },
        {
          role: "user",
          content: `Please analyze this transcript and provide a JSON summary with:
1. keyPoints: Array of the 3-5 most important points
2. topics: Array of 2-4 main topics with topic name and description
3. actionItems: Optional array of action items or next steps if mentioned

Here's the transcript:
${transcriptText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    // Parse the JSON response
    const content = response.choices[0].message.content;
    // TypeScript type guard to ensure content is a string
    const summaryContent = content ? JSON.parse(content) : {};
    
    return {
      keyPoints: summaryContent.keyPoints || [],
      topics: summaryContent.topics || [],
      actionItems: summaryContent.actionItems || []
    };
  } catch (error: any) {
    console.error("Error generating summary:", error);
    throw new Error(error.message || "Failed to generate summary");
  }
}