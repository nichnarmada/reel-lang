import { useState, useEffect } from "react"
import { useAuth } from "../contexts/auth"
import { GeneratedTopic } from "../types/topic"
import { UserGeneratedTopic } from "../types/user"
import {
  collection,
  doc,
  query,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
  where,
} from "@react-native-firebase/firestore"
import { firestore, FIREBASE_COLLECTIONS } from "../utils/firebase/config"

interface UseUserTopicsResult {
  topics: Record<string, UserGeneratedTopic>
  loading: boolean
  error: string | null
  categories: string[]
  recentTopics: [string, UserGeneratedTopic][]
  filteredTopics: [string, UserGeneratedTopic][]
  filterTopics: (query: string, category: string | null) => void
  removeTopic: (topicId: string) => Promise<void>
  updateTopicDifficulty: (topicId: string, difficulty: string) => Promise<void>
}

export const useUserTopics = (): UseUserTopicsResult => {
  const { user } = useAuth()
  const [topics, setTopics] = useState<Record<string, UserGeneratedTopic>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Load topics from subcollection
  useEffect(() => {
    const loadTopics = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const topicsRef = collection(
          firestore,
          FIREBASE_COLLECTIONS.USERS,
          user.uid,
          "generatedTopics"
        )
        const topicsQuery = query(topicsRef, orderBy("lastAccessed", "desc"))
        const snapshot = await getDocs(topicsQuery)

        const loadedTopics: Record<string, UserGeneratedTopic> = {}
        snapshot.forEach((doc) => {
          loadedTopics[doc.id] = {
            id: doc.id,
            userId: user.uid,
            ...doc.data(),
          } as UserGeneratedTopic
        })

        setTopics(loadedTopics)
      } catch (err) {
        console.error("Error loading topics:", err)
        setError(err instanceof Error ? err.message : "Failed to load topics")
      } finally {
        setLoading(false)
      }
    }

    loadTopics()
  }, [user])

  const categories = Array.from(
    new Set(Object.values(topics).map((t) => t.category))
  )

  const filteredTopics = Object.entries(topics).filter(
    ([_, topic]) =>
      (!searchQuery ||
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedCategory || topic.category === selectedCategory)
  )

  const recentTopics = Object.entries(topics)
    .sort(
      ([_, a], [__, b]) =>
        (b.lastAccessed?.toMillis() || 0) - (a.lastAccessed?.toMillis() || 0)
    )
    .slice(0, 5)

  const filterTopics = (query: string, category: string | null) => {
    setSearchQuery(query)
    setSelectedCategory(category)
  }

  const removeTopic = async (topicId: string) => {
    try {
      if (!user) throw new Error("User not authenticated")

      // Remove from Firestore
      const topicRef = doc(
        firestore,
        FIREBASE_COLLECTIONS.USERS,
        user.uid,
        "generatedTopics",
        topicId
      )
      await deleteDoc(topicRef)

      // Remove from local state
      const newTopics = { ...topics }
      delete newTopics[topicId]
      setTopics(newTopics)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove topic")
      throw err
    }
  }

  const updateTopicDifficulty = async (topicId: string, difficulty: string) => {
    try {
      if (!user) throw new Error("User not authenticated")
      if (!topics[topicId]) throw new Error("Topic not found")

      // Update in Firestore
      const topicRef = doc(
        firestore,
        FIREBASE_COLLECTIONS.USERS,
        user.uid,
        "generatedTopics",
        topicId
      )

      const updates = {
        selectedDifficulty: difficulty,
        lastAccessed: Timestamp.now(),
      }

      await updateDoc(topicRef, updates)

      // Update local state
      const updatedTopic: UserGeneratedTopic = {
        ...topics[topicId],
        selectedDifficulty: difficulty as GeneratedTopic["selectedDifficulty"],
        lastAccessed: updates.lastAccessed,
      }

      setTopics((prev) => ({
        ...prev,
        [topicId]: updatedTopic,
      }))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update topic difficulty"
      )
      throw err
    }
  }

  return {
    topics,
    loading,
    error,
    categories,
    recentTopics,
    filteredTopics,
    filterTopics,
    removeTopic,
    updateTopicDifficulty,
  }
}
