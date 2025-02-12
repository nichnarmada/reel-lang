import { getAuth } from "@react-native-firebase/auth"
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
} from "@react-native-firebase/firestore"

// Firebase collection names
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  VIDEOS: "videos",
  SESSIONS: "sessions",
  QUIZZES: "quizzes",
  QUIZ_SESSIONS: "quizSessions",
  SAVED_VIDEOS: "savedVideos",
  FAVORITED_TOPICS: "favoritedTopics",
} as const

// Subcollections under specific collections
export const FIREBASE_SUBCOLLECTIONS = {
  // Subcollections under user profiles
  USER: {
    GENERATED_TOPICS: "generatedTopics", // users/{userId}/generatedTopics
  },
  // Subcollections under sessions
  SESSION: {
    CONTENT: "content", // sessions/{sessionId}/content
    SCRIPTS: "scripts", // sessions/{sessionId}/scripts
    QUIZ: {
      ROOT: "quiz", // sessions/{sessionId}/quiz
      QUESTIONS: "questions", // sessions/{sessionId}/quiz/questions - stores the actual quiz content
    },
  },
} as const

// Type for collection names to ensure type safety
export type FirebaseCollection =
  (typeof FIREBASE_COLLECTIONS)[keyof typeof FIREBASE_COLLECTIONS]

// Type for subcollection names
export type UserSubcollection =
  (typeof FIREBASE_SUBCOLLECTIONS.USER)[keyof typeof FIREBASE_SUBCOLLECTIONS.USER]

export type SessionQuizSubcollection =
  (typeof FIREBASE_SUBCOLLECTIONS.SESSION.QUIZ)[keyof typeof FIREBASE_SUBCOLLECTIONS.SESSION.QUIZ]

export type SessionSubcollection =
  | (typeof FIREBASE_SUBCOLLECTIONS.SESSION)[keyof typeof FIREBASE_SUBCOLLECTIONS.SESSION]
  | SessionQuizSubcollection

// Get Firebase instances
const auth = getAuth()
const firestore = getFirestore()

// Helper functions for Firestore operations
export const getCollection = (collectionName: FirebaseCollection) =>
  collection(firestore, collectionName)

export const getDocument = (
  collectionName: FirebaseCollection,
  docId: string
) => doc(firestore, collectionName, docId)

// Helper for getting a document from a user's subcollection
export const getUserSubcollectionDoc = (
  userId: string,
  subcollection: UserSubcollection,
  docId: string
) => doc(firestore, FIREBASE_COLLECTIONS.USERS, userId, subcollection, docId)

// Helper for getting a document from a session's subcollection
export const getSessionSubcollectionDoc = (
  sessionId: string,
  subcollection: SessionSubcollection,
  docId: string
) =>
  doc(firestore, FIREBASE_COLLECTIONS.SESSIONS, sessionId, subcollection, docId)

// Helper for getting quiz questions from a session
export const getSessionQuizDoc = (sessionId: string) =>
  doc(
    firestore,
    FIREBASE_COLLECTIONS.SESSIONS,
    sessionId,
    FIREBASE_SUBCOLLECTIONS.SESSION.QUIZ.ROOT,
    FIREBASE_SUBCOLLECTIONS.SESSION.QUIZ.QUESTIONS
  )

// Helper for quiz sessions collection
export const getQuizSessionDoc = (quizSessionId: string) =>
  doc(firestore, FIREBASE_COLLECTIONS.QUIZ_SESSIONS, quizSessionId)

// Export configured instances and helpers
export { auth, firestore, collection, doc, getDocs, setDoc }
