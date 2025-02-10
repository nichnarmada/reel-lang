import { Timestamp } from "@react-native-firebase/firestore"
import { router } from "expo-router"
import { createQuiz } from "./quizGenerator"
import { Session } from "../../types/session"
import {
  getDocument,
  FIREBASE_COLLECTIONS,
  FIREBASE_SUBCOLLECTIONS,
  getUserSubcollectionDoc,
  getSessionSubcollectionDoc,
} from "../../utils/firebase/config"
import { GeneratedTopic } from "../../types/topic"
import { doc, getDoc, setDoc } from "@react-native-firebase/firestore"
import { firestore } from "../../utils/firebase/config"
import { UserProgress } from "../../types/quiz"
import { GeneratedContent } from "../content/types"

export const startQuizAfterSession = async (
  session: Session,
  userProgress: UserProgress
): Promise<string | null> => {
  try {
    console.log("Starting quiz generation for session:", {
      sessionId: session.id,
      userId: session.userId,
      topicId: session.topicId,
      topicName: session.topicName,
    })

    // Get content from session's subcollection
    const contentRef = getSessionSubcollectionDoc(
      session.id,
      FIREBASE_SUBCOLLECTIONS.SESSION.CONTENT,
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
    const scriptsRef = getSessionSubcollectionDoc(
      session.id,
      FIREBASE_SUBCOLLECTIONS.SESSION.SCRIPTS,
      "videoScripts"
    )
    const scriptsDoc = await scriptsRef.get()

    // Combine content and scripts
    const content = contentDoc.data() as GeneratedContent
    if (scriptsDoc.exists) {
      const scriptsData = scriptsDoc.data()
      content.videoScripts = scriptsData?.scripts || []
    } else {
      content.videoScripts = []
    }

    // Create a minimal topic object with just the necessary fields for quiz generation
    const topic: GeneratedTopic = {
      name: session.topicName,
      category: session.topicId.split("-")[0], // Extract category from topicId
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
    const quizRef = getSessionSubcollectionDoc(
      session.id,
      FIREBASE_SUBCOLLECTIONS.SESSION.QUIZ,
      "questions"
    )
    await setDoc(quizRef, quiz)

    console.log("Successfully generated quiz:", {
      quizId: quiz.id,
      questionCount: quiz.questions.length,
      topicName: topic.name,
    })

    return quiz.id
  } catch (error) {
    console.error("Error in startQuizAfterSession:", error)
    throw error
  }
}
