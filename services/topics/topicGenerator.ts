import { Timestamp } from "@react-native-firebase/firestore"
import {
  topicSuggestionModel,
  MAX_TOPICS_PER_CATEGORY,
  TOPIC_CACHE_DURATION,
} from "../../utils/gemini/config"
import {
  GeneratedTopicSuggestion,
  PromptContext,
  TopicGenerationInput,
  TopicSuggestionCache,
} from "../../types/topicGeneration"
import { firestore } from "../../utils/firebase/config"
import { doc, getDoc, setDoc } from "@react-native-firebase/firestore"

const CACHE_COLLECTION = "topicSuggestionCache"

const buildPrompt = (context: PromptContext): string => {
  return `Generate specialized learning topic suggestions based on the following context:
Category: ${context.category}
User Skill Level: ${context.userSkillLevel}
Previously Explored Topics: ${context.previousTopics.join(", ")}

Please generate topic suggestions in the following JSON format:
[
  {
    "name": "Topic Name",
    "emoji": "🔍",  // Single most relevant emoji
    "description": "Brief description of the topic",
    "relatedTopics": ["Related Topic 1", "Related Topic 2"],
    "searchTerms": ["term1", "term2", "term3"],
    "confidence": 0.9,
    "reasonForSuggestion": "Why this topic is suggested"
  }
]

Requirements:
1. Generate exactly 3 topics
2. Topic names should be clear and concise (e.g., "Photography Composition" not "Basic Photography Composition (Beginner)")
3. Topic names should not include difficulty levels or skill indicators
4. Include one relevant emoji that best represents the topic
5. Ensure all JSON fields are present
6. Confidence should be a number between 0 and 1
7. Keep descriptions concise (max 100 characters)
8. Include 2-4 related topics
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

const processAIResponse = async (
  response: string,
  category: string
): Promise<GeneratedTopicSuggestion[]> => {
  try {
    // Clean the response string to ensure valid JSON
    const cleanedResponse = response
      .trim()
      // Remove any markdown code block syntax
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      // Remove any trailing commas before closing brackets
      .replace(/,(\s*[\]}])/g, "$1")

    const parsed = JSON.parse(cleanedResponse)

    if (!Array.isArray(parsed)) {
      console.warn("AI response is not an array:", parsed)
      return []
    }

    return parsed.map((item: any) => ({
      ...item,
      category,
      categoryPath: [category],
      availableDifficulties: ["beginner", "intermediate", "advanced"],
      popularity: 0,
      suggestedAt: Timestamp.now(),
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
): Promise<GeneratedTopicSuggestion[] | null> => {
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
  suggestions: GeneratedTopicSuggestion[]
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
  suggestions: GeneratedTopicSuggestion[]
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
): Promise<Record<string, GeneratedTopicSuggestion[]>> => {
  const result: Record<string, GeneratedTopicSuggestion[]> = {}
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
          userSkillLevel: input.skillLevels[category] || "beginner",
          previousTopics: input.exploredTopics || [],
        }

        const { success, error, suggestions } = await generateForCategory(
          context
        )

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
