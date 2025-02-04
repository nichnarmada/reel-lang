import React, { createContext, useContext, useState, useEffect } from "react"
import { firestore } from "../utils/firebase/config"
import { FIREBASE_COLLECTIONS } from "../utils/firebase/config"
import { Topic } from "../types/topic"
import { useAuth } from "./auth"

interface TopicsContextType {
  topics: Topic[]
  loading: boolean
  error: string | null
  searchTopics: (query: string) => Promise<Topic[]>
  getTopicsByCategory: (category: string) => Promise<Topic[]>
  getTrendingTopics: () => Promise<Topic[]>
  refreshTopics: () => Promise<void>
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined)

export function TopicsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all topics on mount or when user changes
  useEffect(() => {
    if (user) {
      refreshTopics()
    }
  }, [user])

  // Refresh topics
  const refreshTopics = async () => {
    setLoading(true)
    setError(null)
    try {
      const topicsSnapshot = await firestore()
        .collection(FIREBASE_COLLECTIONS.TOPICS)
        .get()

      const topicsData = topicsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Topic[]

      setTopics(topicsData)
    } catch (err) {
      console.error("Error fetching topics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch topics")
    } finally {
      setLoading(false)
    }
  }

  // Search topics by query
  const searchTopics = async (query: string): Promise<Topic[]> => {
    try {
      const searchTerms = query.toLowerCase().split(" ")
      const topicsSnapshot = await firestore()
        .collection(FIREBASE_COLLECTIONS.TOPICS)
        .where("searchTerms", "array-contains-any", searchTerms)
        .get()

      return topicsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Topic[]
    } catch (err) {
      console.error("Error searching topics:", err)
      throw err
    }
  }

  // Get topics by category
  const getTopicsByCategory = async (category: string): Promise<Topic[]> => {
    try {
      const topicsSnapshot = await firestore()
        .collection(FIREBASE_COLLECTIONS.TOPICS)
        .where("category", "==", category)
        .get()

      return topicsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Topic[]
    } catch (err) {
      console.error("Error fetching topics by category:", err)
      throw err
    }
  }

  // Get trending topics
  const getTrendingTopics = async (): Promise<Topic[]> => {
    try {
      const topicsSnapshot = await firestore()
        .collection(FIREBASE_COLLECTIONS.TOPICS)
        .orderBy("popularity", "desc")
        .limit(10)
        .get()

      return topicsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Topic[]
    } catch (err) {
      console.error("Error fetching trending topics:", err)
      throw err
    }
  }

  const value = {
    topics,
    loading,
    error,
    searchTopics,
    getTopicsByCategory,
    getTrendingTopics,
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
