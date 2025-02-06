import { initializeApp, getApp } from "@react-native-firebase/app"
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
} from "@react-native-firebase/firestore"
import { initializeAuth, getAuth } from "@react-native-firebase/auth"

// Firebase collection names
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  TOPICS: "topics",
  VIDEOS: "videos",
  SESSIONS: "sessions",
  QUIZZES: "quizzes",
  SAVED_VIDEOS: "savedVideos",
} as const

// Type for collection names to ensure type safety
export type FirebaseCollection =
  (typeof FIREBASE_COLLECTIONS)[keyof typeof FIREBASE_COLLECTIONS]

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

// Export configured instances and helpers
export { auth, firestore, collection, doc, getDocs }
