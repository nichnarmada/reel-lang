import {
  Timestamp,
  getDoc,
  setDoc,
  updateDoc,
  FieldValue,
} from "@react-native-firebase/firestore"

import { createQuiz } from "./quizGenerator"
import {
  Quiz,
  QuizSession,
  QuizStatus,
  UserProgress,
  UserResponse,
} from "../../types/quiz"
import { Session } from "../../types/session"
import { GeneratedTopic } from "../../types/topic"
import {
  FIREBASE_COLLECTIONS,
  getSessionQuizDoc,
  getQuizSessionDoc,
  getDocument,
  doc,
  firestore,
} from "../../utils/firebase/config"
import { GeneratedContent } from "../content/types"

// Helper to create a quiz session
const createQuizSession = async (
  userId: string,
  sessionId: string,
  status: QuizStatus,
  quiz: Quiz,
  topicName: string,
  topicEmoji?: string
): Promise<string> => {
  const quizSessionId = `${sessionId}_quiz_session`
  const quizSessionRef = getQuizSessionDoc(quizSessionId)

  const quizSession: QuizSession = {
    id: quizSessionId,
    userId,
    sessionId,
    status,
    currentQuestionIndex: 0,
    lastUpdatedAt: Timestamp.now(),
    userResponses: [],
    topicName,
    topicEmoji,
  }

  if (status === "in_progress") {
    quizSession.startedAt = Timestamp.now()
  }

  await setDoc(quizSessionRef, quizSession)
  return quizSessionId
}

// Start quiz generation and create a pending or in-progress session
export const startQuizAfterSession = async (
  session: Session,
  userProgress: UserProgress,
  startImmediately: boolean = false
): Promise<{ quizId: string; quizSessionId: string }> => {
  try {
    console.log("Starting quiz generation for session:", {
      sessionId: session.id,
      userId: session.userId,
      topicId: session.topicId,
      topicName: session.topicName,
    })

    // Get content from session's content subcollection
    const contentRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.SESSIONS,
      session.id,
      "content",
      "structure"
    )
    const contentDoc = await getDoc(contentRef)

    if (!contentDoc.exists) {
      console.error("Content not found:", {
        sessionId: session.id,
        path: contentRef.path,
      })
      throw new Error(`Content for session ${session.id} not found`)
    }

    // Get scripts from session's subcollection
    const scriptsRef = doc(
      firestore,
      FIREBASE_COLLECTIONS.SESSIONS,
      session.id,
      "scripts",
      "videoScripts"
    )
    const scriptsDoc = await getDoc(scriptsRef)

    // Combine content and scripts
    const content = contentDoc.data() as GeneratedContent
    if (scriptsDoc.exists) {
      const scriptsData = scriptsDoc.data()
      content.videoScripts = scriptsData?.scripts || []
    } else {
      content.videoScripts = []
    }

    // Create a minimal topic object for quiz generation
    const topic: GeneratedTopic = {
      name: session.topicName,
      category: session.topicId.split("-")[0],
      description: content.structure.concepts[0]?.description || "",
      emoji: session.topicEmoji || "📚",
      selectedDifficulty: content.metadata.difficulty,
      searchTerms: [],
      relatedTopics: [],
      reasonForSuggestion: "",
      confidence: 1,
      availableDifficulties: ["beginner", "intermediate", "advanced"],
      createdAt: Timestamp.now(),
    }

    // Generate quiz using content-based approach
    const quiz = await createQuiz(
      session.userId,
      session.id,
      topic,
      content,
      userProgress
    )

    if (!quiz) {
      throw new Error("Failed to generate quiz")
    }

    // Store quiz in session's subcollection
    const quizRef = getSessionQuizDoc(session.id)
    await setDoc(quizRef, quiz)

    // Create quiz session
    const quizSessionId = await createQuizSession(
      session.userId,
      session.id,
      startImmediately ? "in_progress" : "pending",
      quiz,
      session.topicName,
      session.topicEmoji
    )

    console.log("Successfully generated quiz:", {
      quizId: quiz.id,
      quizSessionId,
      questionCount: quiz.questions.length,
      topicName: topic.name,
    })

    return { quizId: quiz.id, quizSessionId }
  } catch (error) {
    console.error("Error in startQuizAfterSession:", error)
    throw error
  }
}

// Update quiz session progress
export const updateQuizProgress = async (
  quizSessionId: string,
  currentQuestionIndex: number,
  response: UserResponse
) => {
  const quizSessionRef = getQuizSessionDoc(quizSessionId)
  const session = await getDoc(quizSessionRef)

  if (!session.exists) {
    throw new Error("Quiz session not found")
  }

  const currentResponses = session.data()?.userResponses || []
  await updateDoc(quizSessionRef, {
    currentQuestionIndex,
    lastUpdatedAt: Timestamp.now(),
    userResponses: [...currentResponses, response],
  })
}

// Complete quiz session
export const completeQuizSession = async (
  quizSessionId: string,
  finalResponses: UserResponse[]
) => {
  const quizSessionRef = getQuizSessionDoc(quizSessionId)

  await setDoc(
    quizSessionRef,
    {
      status: "completed",
      completedAt: Timestamp.now(),
      lastUpdatedAt: Timestamp.now(),
      userResponses: finalResponses,
    },
    { merge: true }
  )
}

// Start a pending quiz
export const startPendingQuiz = async (
  quizSessionId: string
): Promise<void> => {
  const quizSessionRef = getQuizSessionDoc(quizSessionId)

  await setDoc(
    quizSessionRef,
    {
      status: "in_progress",
      startedAt: Timestamp.now(),
      lastUpdatedAt: Timestamp.now(),
    },
    { merge: true }
  )
}

// Get quiz session
export const getQuizSession = async (
  quizSessionId: string
): Promise<QuizSession | null> => {
  const quizSessionRef = getQuizSessionDoc(quizSessionId)
  const snapshot = await getDoc(quizSessionRef)

  if (!snapshot.exists) return null
  return snapshot.data() as QuizSession
}

// Get quiz content
export const getQuizContent = async (
  sessionId: string
): Promise<Quiz | null> => {
  const quizRef = getSessionQuizDoc(sessionId)
  const snapshot = await getDoc(quizRef)

  if (!snapshot.exists) return null
  return snapshot.data() as Quiz
}

// Retry quiz - creates a new session with same content
export const retryQuiz = async (quizSessionId: string): Promise<string> => {
  // Get the current quiz session
  const quizSession = await getQuizSession(quizSessionId)
  if (!quizSession) {
    throw new Error("Quiz session not found")
  }

  // Get the original quiz content
  const quiz = await getQuizContent(quizSession.sessionId)
  if (!quiz) {
    throw new Error("Quiz content not found")
  }

  // Create a new quiz with shuffled questions
  const shuffledQuestions = [...quiz.questions].sort(() => Math.random() - 0.5)
  const newQuiz: Quiz = {
    ...quiz,
    questions: shuffledQuestions,
  }

  // Create a new quiz session
  const newSessionId = await createQuizSession(
    quizSession.userId,
    quizSession.sessionId,
    "in_progress",
    newQuiz,
    quizSession.topicName,
    quizSession.topicEmoji
  )

  return newSessionId
}
