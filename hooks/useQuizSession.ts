import { useEffect, useState } from "react"
import { onSnapshot } from "@react-native-firebase/firestore"
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"

import {
  startQuizAfterSession,
  updateQuizProgress,
  completeQuizSession,
  startPendingQuiz,
  getQuizSession,
  getQuizContent,
} from "../services/quiz/quizFlow"
import { Quiz, QuizSession, UserResponse } from "../types/quiz"
import {
  getQuizSessionDoc,
  getCollection,
  FIREBASE_COLLECTIONS,
} from "../utils/firebase/config"

interface UseQuizSessionReturn {
  quizSession: QuizSession | null
  quizContent: Quiz | null
  loading: boolean
  error: string | null
  updateProgress: (
    questionIndex: number,
    response: UserResponse
  ) => Promise<void>
  completeQuiz: (responses: UserResponse[]) => Promise<void>
  startQuiz: () => Promise<void>
}

export const useQuizSession = (
  quizSessionId: string | undefined
): UseQuizSessionReturn => {
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
  const [quizContent, setQuizContent] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quizSessionId) {
      setLoading(false)
      return
    }

    // Subscribe to quiz session updates
    const unsubscribe = onSnapshot(
      getQuizSessionDoc(quizSessionId),
      async (snapshot) => {
        try {
          if (!snapshot.exists) {
            setError("Quiz session not found")
            setLoading(false)
            return
          }

          const sessionData = snapshot.data() as QuizSession
          setQuizSession(sessionData)

          // Get quiz content if not loaded
          if (!quizContent) {
            const content = await getQuizContent(sessionData.sessionId)
            if (content) {
              setQuizContent(content)
            }
          }

          setLoading(false)
        } catch (err) {
          console.error("Error in quiz session listener:", err)
          setError("Failed to load quiz session")
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error in quiz session listener:", err)
        setError("Failed to subscribe to quiz updates")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [quizSessionId])

  const updateProgress = async (
    questionIndex: number,
    response: UserResponse
  ) => {
    if (!quizSessionId) return

    try {
      await updateQuizProgress(quizSessionId, questionIndex, response)
    } catch (err) {
      console.error("Error updating quiz progress:", err)
      throw new Error("Failed to update quiz progress")
    }
  }

  const completeQuiz = async (responses: UserResponse[]) => {
    if (!quizSessionId) return

    try {
      await completeQuizSession(quizSessionId, responses)
    } catch (err) {
      console.error("Error completing quiz:", err)
      throw new Error("Failed to complete quiz")
    }
  }

  const startQuiz = async () => {
    if (!quizSessionId) return

    try {
      await startPendingQuiz(quizSessionId)
    } catch (err) {
      console.error("Error starting quiz:", err)
      throw new Error("Failed to start quiz")
    }
  }

  return {
    quizSession,
    quizContent,
    loading,
    error,
    updateProgress,
    completeQuiz,
    startQuiz,
  }
}

// Hook to get all quiz sessions for a user
export const useUserQuizSessions = (userId: string | undefined) => {
  const [sessions, setSessions] = useState<QuizSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Subscribe to user's quiz sessions
    const unsubscribe = onSnapshot(
      getCollection(FIREBASE_COLLECTIONS.QUIZ_SESSIONS)
        .where("userId", "==", userId)
        .orderBy("lastUpdatedAt", "desc"),
      (snapshot) => {
        try {
          const sessionData = snapshot.docs.map(
            (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
              doc.data() as QuizSession
          )
          setSessions(sessionData)
          setLoading(false)
        } catch (err) {
          console.error("Error in quiz sessions listener:", err)
          setError("Failed to load quiz sessions")
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error in quiz sessions listener:", err)
        setError("Failed to subscribe to quiz sessions")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  return { sessions, loading, error }
}
