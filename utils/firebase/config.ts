import auth from "@react-native-firebase/auth"
import firebase from "@react-native-firebase/app"
import firestore from "@react-native-firebase/firestore"
import { Topic, TopicProgress, UserTopicPreferences } from "../../types/topic"

// No need to explicitly initialize Firebase in React Native Firebase
// It automatically initializes using the google-services.json and GoogleService-Info.plist

// For TypeScript, we can export the firebase instance
export default firebase

// Export auth for convenience
export { auth }

// Collection names as constants to avoid typos
export const FIREBASE_COLLECTIONS = {
  TOPICS: "topics",
  USER_TOPIC_PREFERENCES: "userTopicPreferences",
  TOPIC_PROGRESS: "topicProgress",
  FEATURED_TOPICS: "featuredTopics",
  TOPIC_PATHS: "topicPaths",
} as const

// Firestore collection references
export const topicsRef = firestore().collection(FIREBASE_COLLECTIONS.TOPICS)
export const userTopicPreferencesRef = firestore().collection(
  FIREBASE_COLLECTIONS.USER_TOPIC_PREFERENCES
)
export const topicProgressRef = firestore().collection(
  FIREBASE_COLLECTIONS.TOPIC_PROGRESS
)
export const featuredTopicsRef = firestore().collection(
  FIREBASE_COLLECTIONS.FEATURED_TOPICS
)
export const topicPathsRef = firestore().collection(
  FIREBASE_COLLECTIONS.TOPIC_PATHS
)
