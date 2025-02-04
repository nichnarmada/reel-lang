import React, { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth"
import {
  Topic,
  UserTopicPreferences,
  FeaturedTopic,
  TopicPath,
  DifficultyLevel,
} from "../types/topic"
import {
  getTopics,
  getFeaturedTopics,
  getTopicPaths,
  getUserTopicPreferences,
  updateUserTopicPreferences,
} from "../services/topics"

interface TopicsContextType {
  topics: Topic[]
  featuredTopics: FeaturedTopic[]
  topicPaths: TopicPath[]
  userPreferences: UserTopicPreferences | null
  loading: boolean
  error: string | null
  selectTopic: (topicId: string) => Promise<void>
  unselectTopic: (topicId: string) => Promise<void>
  refreshTopics: () => Promise<void>
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined)

export function TopicsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [featuredTopics, setFeaturedTopics] = useState<FeaturedTopic[]>([])
  const [topicPaths, setTopicPaths] = useState<TopicPath[]>([])
  const [userPreferences, setUserPreferences] =
    useState<UserTopicPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    if (user) {
      refreshTopics()
    }
  }, [user])

  const refreshTopics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [topicsData, featuredData, pathsData, preferencesData] =
        await Promise.all([
          getTopics(),
          getFeaturedTopics(),
          getTopicPaths(),
          user ? getUserTopicPreferences(user.uid) : null,
        ])

      setTopics(topicsData)
      setFeaturedTopics(featuredData)
      setTopicPaths(pathsData)
      setUserPreferences(preferencesData)
    } catch (error) {
      console.error("Error refreshing topics:", error)
      setError("Failed to load topics")
    } finally {
      setLoading(false)
    }
  }

  const selectTopic = async (topicId: string) => {
    if (!user || !userPreferences) return

    try {
      const updatedPreferences = {
        ...userPreferences,
        selectedTopics: [
          ...(userPreferences.selectedTopics || []),
          {
            topicId,
            difficulty: "beginner" as DifficultyLevel,
            addedAt: new Date(),
          },
        ],
      }

      await updateUserTopicPreferences(user.uid, updatedPreferences)
      setUserPreferences(updatedPreferences)
    } catch (error) {
      console.error("Error selecting topic:", error)
      setError("Failed to select topic")
    }
  }

  const unselectTopic = async (topicId: string) => {
    if (!user || !userPreferences) return

    try {
      const updatedPreferences = {
        ...userPreferences,
        selectedTopics: userPreferences.selectedTopics.filter(
          (topic) => topic.topicId !== topicId
        ),
      }

      await updateUserTopicPreferences(user.uid, updatedPreferences)
      setUserPreferences(updatedPreferences)
    } catch (error) {
      console.error("Error unselecting topic:", error)
      setError("Failed to unselect topic")
    }
  }

  const value = {
    topics,
    featuredTopics,
    topicPaths,
    userPreferences,
    loading,
    error,
    selectTopic,
    unselectTopic,
    refreshTopics,
  }

  return (
    <TopicsContext.Provider value={value}>{children}</TopicsContext.Provider>
  )
}

export function useTopics() {
  const context = useContext(TopicsContext)
  if (context === undefined) {
    throw new Error("useTopics must be used within a TopicsProvider")
  }
  return context
}
