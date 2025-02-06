import { useState, useEffect, useCallback } from "react"
import { GeneratedTopicSuggestion } from "../types/topicGeneration"
import { generateTopicSuggestions } from "../services/topics/topicGenerator"
import { useUserPreferences } from "./useUserPreferences"

const MAX_DISPLAYED_TOPICS = 6

interface UseTopicSuggestionsResult {
  suggestions: Record<string, GeneratedTopicSuggestion[]>
  displayedSuggestions: GeneratedTopicSuggestion[]
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
    Record<string, GeneratedTopicSuggestion[]>
  >({})
  const [displayedSuggestions, setDisplayedSuggestions] = useState<
    GeneratedTopicSuggestion[]
  >([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { preferences } = useUserPreferences(userId)

  const getRandomTopics = useCallback(
    (allSuggestions: Record<string, GeneratedTopicSuggestion[]>) => {
      const allTopics = Object.values(allSuggestions).flat()

      return shuffleArray(allTopics).slice(0, MAX_DISPLAYED_TOPICS)
    },
    []
  )

  const shuffleSuggestions = useCallback(() => {
    setDisplayedSuggestions(getRandomTopics(suggestions))
  }, [suggestions, getRandomTopics])

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
        skillLevels: preferences.skillLevels,
        exploredTopics: [],
      })

      const newErrors: Record<string, string> = {}
      Object.entries(result).forEach(([category, categorySuggestions]) => {
        if (categorySuggestions.length === 0) {
          newErrors[category] =
            "Failed to generate suggestions for this category"
        }
      })

      setSuggestions(result)
      setDisplayedSuggestions(getRandomTopics(result))

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
