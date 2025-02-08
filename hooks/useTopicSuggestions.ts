import { useState, useEffect, useCallback } from "react"
import { GeneratedTopic } from "../types/topic"
import { generateTopicSuggestions } from "../services/topics/topicGenerator"
import { useUserPreferences } from "./useUserPreferences"
import { doc, setDoc } from "@react-native-firebase/firestore"
import { firestore, FIREBASE_COLLECTIONS } from "../utils/firebase/config"
import { UserGeneratedTopic } from "../types/user"

const MAX_DISPLAYED_TOPICS = 6

interface UseTopicSuggestionsResult {
  suggestions: Record<string, GeneratedTopic>
  displayedSuggestions: GeneratedTopic[]
  loading: boolean
  errors: Record<string, string>
  refreshSuggestions: () => Promise<void>
  shuffleSuggestions: () => void
  hasErrors: boolean
}

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export const useTopicSuggestions = (
  userId: string
): UseTopicSuggestionsResult => {
  const [suggestions, setSuggestions] = useState<
    Record<string, GeneratedTopic>
  >({})
  const [displayedSuggestions, setDisplayedSuggestions] = useState<
    GeneratedTopic[]
  >([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { preferences } = useUserPreferences(userId)

  const getRandomTopics = useCallback(
    (allSuggestions: Record<string, GeneratedTopic>) => {
      const allTopics = Object.values(allSuggestions)
      return shuffleArray(allTopics).slice(0, MAX_DISPLAYED_TOPICS)
    },
    []
  )

  const shuffleSuggestions = useCallback(() => {
    setDisplayedSuggestions(getRandomTopics(suggestions))
  }, [suggestions, getRandomTopics])

  const saveSuggestionToFirestore = async (
    topic: GeneratedTopic,
    topicId: string
  ) => {
    if (!userId) return

    const topicRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.USERS,
      userId,
      "generatedTopics",
      topicId
    )

    const userGeneratedTopic: UserGeneratedTopic = {
      ...topic,
      id: topicId,
      userId,
    }

    await setDoc(topicRef, userGeneratedTopic)
  }

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      setErrors({})

      if (!preferences) {
        throw new Error("User preferences not loaded")
      }

      const result = await generateTopicSuggestions({
        userId,
        preferredCategories: preferences.preferredCategories,
        exploredTopics: [],
        topicNumber: 5,
      })

      const newErrors: Record<string, string> = {}
      const newSuggestions: Record<string, GeneratedTopic> = {}

      // Process and save each suggestion
      await Promise.all(
        Object.entries(result).map(async ([category, categorySuggestions]) => {
          if (categorySuggestions.length === 0) {
            newErrors[category] =
              "Failed to generate suggestions for this category"
          } else {
            await Promise.all(
              categorySuggestions.map(async (suggestion) => {
                const topicId = `${suggestion.category}-${suggestion.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`
                newSuggestions[topicId] = suggestion
                await saveSuggestionToFirestore(suggestion, topicId)
              })
            )
          }
        })
      )

      setSuggestions(newSuggestions)
      setDisplayedSuggestions(getRandomTopics(newSuggestions))

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch suggestions"
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId && preferences) {
      fetchSuggestions()
    }
  }, [userId, preferences])

  return {
    suggestions,
    displayedSuggestions,
    loading,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    refreshSuggestions: fetchSuggestions,
    shuffleSuggestions,
  }
}
