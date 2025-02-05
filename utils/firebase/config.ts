import auth from "@react-native-firebase/auth"
import firebase from "@react-native-firebase/app"
import firestore from "@react-native-firebase/firestore"

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

// No need to explicitly initialize Firebase in React Native Firebase
// It automatically initializes using the google-services.json and GoogleService-Info.plist

// Export configured instances
export { auth, firestore }
export default firebase
