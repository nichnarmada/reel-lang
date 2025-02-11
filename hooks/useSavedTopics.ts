import {
  collection,
  query,
  orderBy,
  Timestamp,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "@react-native-firebase/firestore"
import { useState, useEffect, useCallback } from "react"

import { useAuth } from "../contexts/auth"
import { GeneratedTopic } from "../types/topic"
import { firestore, FIREBASE_COLLECTIONS } from "../utils/firebase/config"

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
    if (!user) {
      setLoading(false)
      return
    }

    // Create query for saved topics
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

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      savedTopicsQuery,
      (snapshot) => {
        const loadedTopics: SavedTopic[] = []
        snapshot.forEach((doc) => {
          loadedTopics.push({ id: doc.id, ...doc.data() } as SavedTopic)
        })
        setTopics(loadedTopics)
        setLoading(false)
      },
      (err) => {
        console.error("Error in saved topics subscription:", err)
        setError(
          err instanceof Error ? err.message : "Failed to load saved topics"
        )
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => unsubscribe()
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
        // Remove local state update since we have real-time updates
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
        // Remove local state update since we have real-time updates
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
