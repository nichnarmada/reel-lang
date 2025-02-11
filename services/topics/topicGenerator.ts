import {
  Timestamp,
  doc,
  getDoc,
  setDoc,
} from "@react-native-firebase/firestore"

import { GeneratedTopic } from "../../types/topic"
import {
  PromptContext,
  TopicGenerationInput,
} from "../../types/topicGeneration"
import { firestore } from "../../utils/firebase/config"
import {
  topicSuggestionModel,
  MAX_TOPICS_PER_CATEGORY,
  TOPIC_CACHE_DURATION,
} from "../../utils/gemini/config"

const CACHE_COLLECTION = "topicSuggestionCache"

const buildPrompt = (context: PromptContext): string => {
  return `Generate specialized learning topic suggestions based on the following context:
Category: ${context.category}
Previously Explored Topics: ${context.previousTopics.join(", ")}

Please generate topic suggestions in the following JSON format:
[
  {
    "name": "Topic Name",
    "emoji": "🔍",  // Single most relevant emoji
    "description": "Brief description of the topic",
    "relatedTopics": [
      {
        "name": "Related Topic 1",
        "emoji": "📚"  // Relevant emoji for each related topic
      },
      {
        "name": "Related Topic 2",
        "emoji": "🎯"
      }
    ],
    "searchTerms": ["term1", "term2", "term3"],
    "confidence": 0.9,
    "reasonForSuggestion": "Why this topic is suggested"
  }
]

Requirements:
1. Generate exactly ${context.topicNumber} topics
2. Topic names should be clear and concise (e.g., "Photography Composition" not "Basic Photography Composition")
3. Include one relevant emoji that best represents the topic
4. Each related topic must have its own relevant emoji
5. Include 2-4 related topics per main topic
6. Ensure all JSON fields are present
7. Confidence should be a number between 0 and 1
8. Keep descriptions concise (max 100 characters)
9. Include 3-5 search terms
10. Format as a valid JSON array

Examples of good topic and emoji combinations:
- "Camera Modes" 📸
- "Color Theory" 🎨
- "Spanish Conjugation" 📚
- "Chemical Reactions" 🧪
- "Brain Functions" 🧠
- "Music Theory" 🎵
- "Data Structures" 💻
- "World Geography" 🌍

Return only the JSON array, no additional text or formatting.`
}

interface TopicSuggestionCache {
  userId: string
  categoryId: string
  suggestions: GeneratedTopic[]
  generatedAt: Timestamp
  expiresAt: Timestamp
}

export const processAIResponse = async (
  response: string,
  category: string
): Promise<GeneratedTopic[]> => {
  try {
    const cleanedResponse = response
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/,(\s*[\]}])/g, "$1")

    const parsed = JSON.parse(cleanedResponse)

    if (!Array.isArray(parsed)) {
      console.warn("AI response is not an array:", parsed)
      return []
    }

    return parsed.map((item: any) => ({
      name: item.name,
      category,
      description: item.description,
      emoji: item.emoji || "📚", // Default emoji if none provided
      reasonForSuggestion: item.reasonForSuggestion,
      confidence: item.confidence,
      searchTerms: item.searchTerms || [],
      relatedTopics: Array.isArray(item.relatedTopics)
        ? item.relatedTopics.map((topic: any) => ({
            name: typeof topic === "string" ? topic : topic.name,
            emoji: typeof topic === "string" ? "📚" : topic.emoji || "📚",
          }))
        : [],
      availableDifficulties: ["beginner", "intermediate", "advanced"],
      createdAt: Timestamp.now(),
      lastAccessed: Timestamp.now(),
    }))
  } catch (error) {
    console.error("Error processing AI response:", error)
    console.error("Raw response:", response)
    return []
  }
}

const checkCache = async (
  userId: string,
  categoryId: string
): Promise<GeneratedTopic[] | null> => {
  const cacheRef = doc(firestore, CACHE_COLLECTION, `${userId}_${categoryId}`)
  const cacheDoc = await getDoc(cacheRef)

  if (cacheDoc.exists) {
    const cache = cacheDoc.data() as TopicSuggestionCache
    if (cache.expiresAt.seconds > Timestamp.now().seconds) {
      return cache.suggestions
    }
  }
  return null
}

const storeSuggestionsCache = async (
  userId: string,
  categoryId: string,
  suggestions: GeneratedTopic[]
) => {
  const cacheRef = doc(firestore, CACHE_COLLECTION, `${userId}_${categoryId}`)
  const now = Timestamp.now()
  const cache: TopicSuggestionCache = {
    userId,
    categoryId,
    suggestions,
    generatedAt: now,
    expiresAt: new Timestamp(now.seconds + TOPIC_CACHE_DURATION / 1000, 0),
  }
  await setDoc(cacheRef, cache)
}

interface CategoryGenerationResult {
  success: boolean
  error?: string
  suggestions: GeneratedTopic[]
}

const generateForCategory = async (
  context: PromptContext
): Promise<CategoryGenerationResult> => {
  try {
    const prompt = buildPrompt(context)
    const result = await topicSuggestionModel.generateContent(prompt)
    const response = result.response.text()
    const suggestions = await processAIResponse(response, context.category)

    if (suggestions.length === 0) {
      return {
        success: false,
        error: "No suggestions were generated",
        suggestions: [],
      }
    }

    return {
      success: true,
      suggestions,
    }
  } catch (error) {
    console.error(
      `Error generating topics for category ${context.category}:`,
      error
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      suggestions: [],
    }
  }
}

export const generateTopicSuggestions = async (
  input: TopicGenerationInput
): Promise<Record<string, GeneratedTopic[]>> => {
  const result: Record<string, GeneratedTopic[]> = {}
  const errors: Record<string, string> = {}

  await Promise.all(
    input.preferredCategories.map(async (category) => {
      try {
        // Check cache first
        const cachedSuggestions = await checkCache(input.userId, category)
        if (cachedSuggestions) {
          result[category] = cachedSuggestions
          return
        }

        // Generate new suggestions
        const context: PromptContext = {
          category,
          previousTopics: input.exploredTopics || [],
          topicNumber: input.topicNumber || 3,
        }

        const { success, error, suggestions } =
          await generateForCategory(context)

        if (success && suggestions.length > 0) {
          // Limit the number of suggestions per category
          result[category] = suggestions.slice(
            0,
            input.topicsPerCategory || MAX_TOPICS_PER_CATEGORY
          )
          // Store in cache
          await storeSuggestionsCache(input.userId, category, result[category])
        } else {
          errors[category] = error || "Failed to generate suggestions"
          // Set empty array for failed category
          result[category] = []
        }
      } catch (error) {
        console.error(`Error processing category ${category}:`, error)
        errors[category] =
          error instanceof Error ? error.message : "Unknown error occurred"
        result[category] = [] // Set empty array for failed category
      }
    })
  )

  // Log errors if any occurred
  if (Object.keys(errors).length > 0) {
    console.warn("Some categories failed to generate suggestions:", errors)
  }

  return result
}
