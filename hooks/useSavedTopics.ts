import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/auth"
import {
  collection,
  query,
  orderBy,
  getDocs,
  Timestamp,
  where,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "@react-native-firebase/firestore"
import { firestore, FIREBASE_COLLECTIONS } from "../utils/firebase/config"
import { GeneratedTopic } from "../types/topic"

export interface SavedTopic extends GeneratedTopic {
  id: string
  favoritedAt: Timestamp
  isGeneratedTopic: boolean
}

interface UseSavedTopicsResult {
  topics: SavedTopic[]
  loading: boolean
  error: string | null
  favoriteTopic: (topic: GeneratedTopic) => Promise<void>
  unfavoriteTopic: (topicId: string) => Promise<void>
  isTopicFavorited: (topicId: string) => boolean
}

export const useSavedTopics = (): UseSavedTopicsResult => {
  const { user } = useAuth()
  const [topics, setTopics] = useState<SavedTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSavedTopics = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const savedTopicsRef = collection(
          firestore,
          FIREBASE_COLLECTIONS.USERS,
          user.uid,
          "favoritedTopics"
        )
        const savedTopicsQuery = query(
          savedTopicsRef,
          orderBy("favoritedAt", "desc")
        )
        const snapshot = await getDocs(savedTopicsQuery)

        const loadedTopics: SavedTopic[] = []
        snapshot.forEach((doc) => {
          loadedTopics.push({ id: doc.id, ...doc.data() } as SavedTopic)
        })

        setTopics(loadedTopics)
      } catch (err) {
        console.error("Error loading saved topics:", err)
        setError(
          err instanceof Error ? err.message : "Failed to load saved topics"
        )
      } finally {
        setLoading(false)
      }
    }

    loadSavedTopics()
  }, [user])

  const favoriteTopic = useCallback(
    async (topic: GeneratedTopic) => {
      if (!user) throw new Error("User not authenticated")

      try {
        const topicId = `${topic.category}-${topic.name
          .toLowerCase()
          .replace(/\s+/g, "-")}`

        const savedTopic: SavedTopic = {
          ...topic,
          id: topicId,
          favoritedAt: Timestamp.now(),
          isGeneratedTopic: true,
        }

        const topicRef = doc(
          firestore,
          FIREBASE_COLLECTIONS.USERS,
          user.uid,
          "favoritedTopics",
          topicId
        )

        await setDoc(topicRef, savedTopic)

        // Update local state
        setTopics((prev) => [savedTopic, ...prev])
      } catch (err) {
        console.error("Error favoriting topic:", err)
        throw err
      }
    },
    [user]
  )

  const unfavoriteTopic = useCallback(
    async (topicId: string) => {
      if (!user) throw new Error("User not authenticated")

      try {
        const topicRef = doc(
          firestore,
          FIREBASE_COLLECTIONS.USERS,
          user.uid,
          "favoritedTopics",
          topicId
        )

        await deleteDoc(topicRef)

        // Update local state
        setTopics((prev) => prev.filter((t) => t.id !== topicId))
      } catch (err) {
        console.error("Error unfavoriting topic:", err)
        throw err
      }
    },
    [user]
  )

  const isTopicFavorited = useCallback(
    (topicId: string) => {
      return topics.some((t) => t.id === topicId)
    },
    [topics]
  )

  return {
    topics,
    loading,
    error,
    favoriteTopic,
    unfavoriteTopic,
    isTopicFavorited,
  }
}
