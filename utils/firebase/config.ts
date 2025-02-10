import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
} from "@react-native-firebase/firestore"
import { getAuth } from "@react-native-firebase/auth"

// Firebase collection names
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  VIDEOS: "videos",
  SESSIONS: "sessions",
  QUIZZES: "quizzes",
  SAVED_VIDEOS: "savedVideos",
  FAVORITED_TOPICS: "favoritedTopics",
} as const

// Subcollections under specific collections
export const FIREBASE_SUBCOLLECTIONS = {
  // Subcollections under user profiles
  USER: {
    GENERATED_TOPICS: "generatedTopics", // users/{userId}/generatedTopics
  },
} as const

// Type for collection names to ensure type safety
export type FirebaseCollection =
  (typeof FIREBASE_COLLECTIONS)[keyof typeof FIREBASE_COLLECTIONS]

// Type for subcollection names
export type UserSubcollection =
  (typeof FIREBASE_SUBCOLLECTIONS.USER)[keyof typeof FIREBASE_SUBCOLLECTIONS.USER]

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

// Export configured instances and helpers
export { auth, firestore, collection, doc, getDocs, setDoc }
