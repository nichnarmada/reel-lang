import { useEffect, useState } from "react"
import firestore from "@react-native-firebase/firestore"
import { Session, SessionStatus, SessionProgress } from "../types/session"

// Firebase collection names
const FIREBASE_COLLECTIONS = {
  SESSIONS: "sessions",
} as const

interface UseLearningSessionResult {
  sessions: Session[]
  loading: boolean
  error: string | null
  resumeSession: (sessionId: string) => Promise<void>
  pauseSession: (sessionId: string, progress: SessionProgress) => Promise<void>
  updateSessionProgress: (
    sessionId: string,
    progress: Partial<SessionProgress>
  ) => Promise<void>
}

export const useLearningSession = (
  userId: string
): UseLearningSessionResult => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Create a query for active and paused sessions for this user
    const unsubscribe = firestore()
      .collection(FIREBASE_COLLECTIONS.SESSIONS)
      .where("userId", "==", userId)
      .where("status", "in", ["active", "paused"])
      .orderBy("startTime", "desc") // Most recent sessions first
      .onSnapshot(
        (snapshot) => {
          const sessionsList: Session[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            sessionsList.push({
              id: doc.id,
              userId: data.userId,
              topicId: data.topicId,
              topicName: data.topicName,
              status: data.status,
              startTime: data.startTime,
              completedAt: data.completedAt,
              pausedAt: data.pausedAt,
              resumedAt: data.resumedAt,
              duration: data.duration,
              progress: data.progress,
              topicEmoji: data.topicEmoji,
            })
          })
          setSessions(sessionsList)
          setLoading(false)
        },
        (err) => {
          console.error("Error fetching sessions:", err)
          setError("Failed to load learning sessions")
          setLoading(false)
        }
      )

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [userId])

  const pauseSession = async (sessionId: string, progress: SessionProgress) => {
    try {
      await firestore()
        .collection(FIREBASE_COLLECTIONS.SESSIONS)
        .doc(sessionId)
        .update({
          status: "paused" as SessionStatus,
          pausedAt: firestore.Timestamp.now(),
          progress: {
            ...progress,
            timeSpentSeconds: progress.timeSpentSeconds,
            remainingTimeSeconds: progress.remainingTimeSeconds,
          },
        })
    } catch (err) {
      console.error("Error pausing session:", err)
      throw new Error("Failed to pause session")
    }
  }

  const resumeSession = async (sessionId: string) => {
    try {
      await firestore()
        .collection(FIREBASE_COLLECTIONS.SESSIONS)
        .doc(sessionId)
        .update({
          status: "active" as SessionStatus,
          resumedAt: firestore.Timestamp.now(),
        })
    } catch (err) {
      console.error("Error resuming session:", err)
      throw new Error("Failed to resume session")
    }
  }

  const updateSessionProgress = async (
    sessionId: string,
    progress: Partial<SessionProgress>
  ) => {
    try {
      const sessionRef = firestore()
        .collection(FIREBASE_COLLECTIONS.SESSIONS)
        .doc(sessionId)

      // Get current progress
      const sessionDoc = await sessionRef.get()
      const currentProgress = sessionDoc.data()?.progress || {}

      // Update progress
      await sessionRef.update({
        progress: {
          ...currentProgress,
          ...progress,
          timeSpentSeconds:
            (currentProgress.timeSpentSeconds || 0) +
            (progress.timeSpentSeconds || 0),
          videosWatched:
            (currentProgress.videosWatched || 0) +
            (progress.videosWatched || 0),
        },
      })
    } catch (err) {
      console.error("Error updating session progress:", err)
      throw new Error("Failed to update session progress")
    }
  }

  return {
    sessions,
    loading,
    error,
    resumeSession,
    pauseSession,
    updateSessionProgress,
  }
}
