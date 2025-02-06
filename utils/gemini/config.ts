import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing Gemini API key in environment variables")
}

export const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY
)

// The model we'll use for generating topic suggestions
export const topicSuggestionModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite-preview-02-05",
})

// Configuration for topic generation
export const TOPIC_GENERATION_CONFIG = {
  maxOutputTokens: 1024,
  temperature: 0.7, // Balance between creativity and consistency
  topK: 40,
  topP: 0.8,
}

// Cache configuration
export const TOPIC_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
export const MAX_TOPICS_PER_CATEGORY = 15
