import firestore from "@react-native-firebase/firestore"
import {
  Topic,
  TopicProgress,
  UserTopicPreferences,
  FeaturedTopic,
  TopicPath,
  Achievement,
  TopicPreference,
} from "../types/topic"
import {
  topicsRef,
  userTopicPreferencesRef,
  topicProgressRef,
  featuredTopicsRef,
  topicPathsRef,
} from "../utils/firebase/config"

// Topic CRUD Operations
export const getTopics = async (): Promise<Topic[]> => {
  try {
    const snapshot = await topicsRef.get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Topic[]
  } catch (error) {
    console.error("Error fetching topics:", error)
    throw error
  }
}

export const getTopicById = async (topicId: string): Promise<Topic | null> => {
  try {
    const doc = await topicsRef.doc(topicId).get()
    if (!doc.exists) return null

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate(),
    } as Topic
  } catch (error) {
    console.error("Error fetching topic:", error)
    throw error
  }
}

// User Topic Preferences
export const getUserTopicPreferences = async (
  userId: string
): Promise<UserTopicPreferences | null> => {
  try {
    const doc = await userTopicPreferencesRef.doc(userId).get()
    if (!doc.exists) return null

    return {
      userId: doc.id,
      ...doc.data(),
      selectedTopics: doc
        .data()
        ?.selectedTopics.map((topic: TopicPreference & { addedAt: any }) => ({
          ...topic,
          addedAt: topic.addedAt.toDate(),
        })),
    } as UserTopicPreferences
  } catch (error) {
    console.error("Error fetching user topic preferences:", error)
    throw error
  }
}

export const updateUserTopicPreferences = async (
  userId: string,
  preferences: Partial<UserTopicPreferences>
): Promise<void> => {
  try {
    await userTopicPreferencesRef.doc(userId).set(
      {
        ...preferences,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  } catch (error) {
    console.error("Error updating user topic preferences:", error)
    throw error
  }
}

// Topic Progress
export const getTopicProgress = async (
  userId: string,
  topicId: string
): Promise<TopicProgress | null> => {
  try {
    const doc = await topicProgressRef.doc(`${userId}_${topicId}`).get()

    if (!doc.exists) return null

    return {
      ...doc.data(),
      lastActivity: doc.data()?.lastActivity.toDate(),
      achievements: doc
        .data()
        ?.achievements.map(
          (achievement: Achievement & { unlockedAt: any }) => ({
            ...achievement,
            unlockedAt: achievement.unlockedAt.toDate(),
          })
        ),
    } as TopicProgress
  } catch (error) {
    console.error("Error fetching topic progress:", error)
    throw error
  }
}

export const updateTopicProgress = async (
  progress: Partial<TopicProgress>
): Promise<void> => {
  try {
    const { userId, topicId } = progress
    await topicProgressRef.doc(`${userId}_${topicId}`).set(
      {
        ...progress,
        lastActivity: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  } catch (error) {
    console.error("Error updating topic progress:", error)
    throw error
  }
}

// Featured Topics
export const getFeaturedTopics = async (): Promise<FeaturedTopic[]> => {
  try {
    const now = new Date()
    const snapshot = await featuredTopicsRef
      .where("featuredUntil", ">", now)
      .orderBy("featuredUntil")
      .orderBy("priority", "desc")
      .get()

    // We need to fetch the actual topic data since featuredTopics only has references
    const featuredTopics = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const topicDoc = await topicsRef.doc(doc.data().topicId).get()
        return {
          id: doc.id,
          ...topicDoc.data(), // Topic data
          ...doc.data(), // Featured data (priority, featuredUntil, etc)
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          featuredUntil: doc.data().featuredUntil?.toDate(),
        } as FeaturedTopic
      })
    )

    return featuredTopics
  } catch (error) {
    console.error("Error fetching featured topics:", error)
    throw error
  }
}

// Topic Paths
export const getTopicPaths = async (): Promise<TopicPath[]> => {
  try {
    const snapshot = await topicPathsRef.orderBy("difficulty").get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TopicPath[]
  } catch (error) {
    console.error("Error fetching topic paths:", error)
    throw error
  }
}
