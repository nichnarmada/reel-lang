import { Timestamp } from "@react-native-firebase/firestore"
import { GeneratedTopic } from "../../types/topic"
import { Session, SessionDuration } from "../../types/session"
import { DifficultyLevel } from "../../types"
import {
  firestore,
  FIREBASE_COLLECTIONS,
  FIREBASE_SUBCOLLECTIONS,
  getSessionSubcollectionDoc,
} from "../../utils/firebase/config"
import { doc, setDoc } from "@react-native-firebase/firestore"
import { generateEducationalContent } from "./contentGenerator"
import { GeneratedContent } from "./types"

interface ContentBundle {
  session: Session
  content: GeneratedContent
}

export const startContentGeneration = async (
  userId: string,
  topic: GeneratedTopic,
  duration: SessionDuration
): Promise<ContentBundle | null> => {
  try {
    console.log("Starting content generation for:", {
      topicName: topic.name,
      difficulty: topic.selectedDifficulty,
      duration,
    })

    // 1. Create a new session first
    const sessionId = `session_${Date.now()}`
    const session: Session = {
      id: sessionId,
      userId,
      topicId: topic.name,
      topicName: topic.name,
      status: "active",
      startTime: Timestamp.now(),
      duration,
      progress: {
        timeSpentSeconds: 0,
        videosWatched: 0,
        remainingTimeSeconds: duration * 60,
      },
      topicEmoji: topic.emoji,
    }

    // 2. Store session in Firebase
    const sessionRef = doc(firestore, FIREBASE_COLLECTIONS.SESSIONS, sessionId)
    await setDoc(sessionRef, session)

    // 3. Generate educational content and video scripts
    const content = await generateEducationalContent(
      topic,
      topic.selectedDifficulty || "beginner",
      duration
    )

    if (!content) {
      throw new Error("Failed to generate educational content")
    }

    // 4. Store content in session's subcollection
    const contentRef = getSessionSubcollectionDoc(
      sessionId,
      FIREBASE_SUBCOLLECTIONS.SESSION.CONTENT,
      "structure"
    )
    await setDoc(contentRef, content)

    // 5. Store scripts in session's subcollection
    const scriptsRef = getSessionSubcollectionDoc(
      sessionId,
      FIREBASE_SUBCOLLECTIONS.SESSION.SCRIPTS,
      "videoScripts"
    )
    await setDoc(scriptsRef, { scripts: content.videoScripts || [] })

    console.log("Created new session with content:", {
      sessionId: session.id,
      concepts: content.structure.concepts.length,
      videoSegments: content.videoScripts?.length || 0,
      totalDuration: content.metadata.totalDuration,
    })

    return {
      session,
      content,
    }
  } catch (error) {
    console.error("Error in content generation flow:", error)
    return null
  }
}

export const getContentForSession = async (
  sessionId: string
): Promise<GeneratedContent | null> => {
  try {
    // Get content from session's subcollection
    const contentRef = getSessionSubcollectionDoc(
      sessionId,
      FIREBASE_SUBCOLLECTIONS.SESSION.CONTENT,
      "structure"
    )
    const contentDoc = await contentRef.get()

    if (!contentDoc.exists) {
      console.error("Content not found for session:", sessionId)
      return null
    }

    // Get scripts from session's subcollection
    const scriptsRef = getSessionSubcollectionDoc(
      sessionId,
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

    return content
  } catch (error) {
    console.error("Error fetching content for session:", error)
    return null
  }
}
