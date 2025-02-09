import { router } from "expo-router"
import { createQuiz } from "./quizGenerator"
import { Session } from "../../types/session"
import { getDocument, FIREBASE_COLLECTIONS } from "../../utils/firebase/config"
import { GeneratedTopic } from "../../types/topic"
import { doc } from "@react-native-firebase/firestore"
import { firestore } from "../../utils/firebase/config"

export const startQuizAfterSession = async (session: Session) => {
  try {
    console.log("Starting quiz generation for session:", {
      sessionId: session.id,
      topicId: session.topicId,
      userId: session.userId,
    })

    // Get the topic details from user's generatedTopics subcollection
    const topicDoc = doc(
      firestore,
      FIREBASE_COLLECTIONS.USERS,
      session.userId,
      "generatedTopics",
      session.topicId
    )

    const topicSnapshot = await topicDoc.get()
    if (!topicSnapshot.exists) {
      throw new Error("Topic not found")
    }

    const topicData = topicSnapshot.data() as GeneratedTopic
    if (!topicData) {
      throw new Error("Topic data is invalid")
    }

    console.log("Found topic data:", {
      topicName: topicData.name,
      difficulty: topicData.selectedDifficulty,
    })

    // Generate the quiz
    const quiz = await createQuiz(
      session.userId,
      session.id,
      topicData,
      topicData.selectedDifficulty || "beginner" // Use selected difficulty or default to beginner
    )

    if (!quiz) {
      throw new Error("Failed to generate quiz")
    }

    console.log("Generated quiz:", {
      quizId: quiz.id,
      numberOfQuestions: quiz.questions.length,
      topics: quiz.metadata.topics,
    })

    // Navigation params
    const params = {
      sessionId: session.id,
      quizId: quiz.id,
    }
    console.log("Navigating to quiz with params:", params)

    // Navigate to the quiz page
    router.replace({
      pathname: "/quiz/[sessionId]" as const,
      params,
    })

    return quiz
  } catch (error) {
    console.error("Error starting quiz:", error)
    throw error
  }
}
