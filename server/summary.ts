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
          content: `You are an expert summarizer. Extract key information from transcripts and organize them into a clear, structured format. Be concise but comprehensive.`
        },
        {
          role: "user",
          content: `Please analyze this transcript and provide:
1. Key Points: Bullet list of the 3-5 most important points
2. Topics Covered: 2-4 main topics with brief descriptions
3. Action Items: If any action items or next steps are mentioned (if none, omit this section)

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