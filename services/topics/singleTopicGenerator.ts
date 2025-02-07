import { GeneratedTopic } from "../../types/topic"
import { topicSuggestionModel } from "../../utils/gemini/config"
import { processAIResponse } from "./topicGenerator"

const buildSingleTopicPrompt = (
  name: string,
  category: string,
  emoji: string
): string => {
  return `Generate detailed information for the following topic:
Topic Name: ${name}
Category: ${category}
Emoji: ${emoji}

Return in the same JSON format as other topics:
{
  "name": "${name}",
  "emoji": "${emoji}",
  "description": "Brief description of what this topic covers and its importance",
  "relatedTopics": [
    {
      "name": "Related Topic 1",
      "emoji": "📚"
    }
  ],
  "searchTerms": ["term1", "term2", "term3"],
  "confidence": 0.9,
  "reasonForSuggestion": "Why this topic is valuable for learning"
}

Requirements:
1. Keep the provided name and emoji
2. Generate a clear, concise description (max 100 characters)
3. Include 2-4 related topics, each with a relevant emoji
4. Include 3-5 relevant search terms
5. Provide a compelling reason for learning this topic
6. Format as a valid JSON object

Return only the JSON object, no additional text or formatting.`
}

export const generateSingleTopic = async (
  name: string,
  category: string,
  emoji: string
): Promise<GeneratedTopic | null> => {
  try {
    const prompt = buildSingleTopicPrompt(name, category, emoji)
    const result = await topicSuggestionModel.generateContent(prompt)
    const response = result.response.text()

    // Clean the response and parse it
    const cleanedResponse = response
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/,(\s*[\]}])/g, "$1")

    const parsed = JSON.parse(cleanedResponse)

    // Wrap the single object in an array for processAIResponse
    const processed = await processAIResponse(`[${cleanedResponse}]`, category)
    return processed[0] || null
  } catch (error) {
    console.error("Error generating single topic:", error)
    return null
  }
}
