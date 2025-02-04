import firestore from "@react-native-firebase/firestore"
import {
  Topic,
  TopicProgress,
  UserTopicPreferences,
  FeaturedTopic,
  TopicPath,
  Achievement,
  TopicPreference,
  RelatedContent,
  TopicSuggestion,
} from "../types/topic"
import {
  topicsRef,
  userTopicPreferencesRef,
  topicProgressRef,
  featuredTopicsRef,
  topicPathsRef,
} from "../utils/firebase/config"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore"

// Topic CRUD Operations
export const getTopics = async (): Promise<Topic[]> => {
  try {
    const snapshot = await topicsRef.get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        videos: data.videos?.map((video: any) => ({
          ...video,
          createdAt: video.createdAt?.toDate(),
        })),
      } as Topic
    })
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

    const data = doc.data()
    return {
      userId: doc.id,
      ...data,
      learningGoals: data?.learningGoals?.map((goal: any) => ({
        ...goal,
        createdAt: goal.createdAt?.toDate(),
        updatedAt: goal.updatedAt?.toDate(),
      })),
      selectedTopics: data?.selectedTopics?.map((topic: any) => ({
        ...topic,
        addedAt: topic.addedAt?.toDate(),
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

    const featuredTopics = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const featuredData = doc.data()
        const topicDoc = await topicsRef.doc(featuredData.topicId).get()

        if (!topicDoc.exists) {
          console.warn(`Topic ${featuredData.topicId} not found`)
          return null
        }

        return {
          id: featuredData.topicId,
          ...topicDoc.data(),
          featuredUntil: featuredData.featuredUntil?.toDate(),
          priority: featuredData.priority,
          cardImage: featuredData.cardImage,
        } as FeaturedTopic
      })
    )

    return featuredTopics.filter(
      (topic): topic is FeaturedTopic => topic !== null
    )
  } catch (error) {
    console.error("Error fetching featured topics:", error)
    throw error
  }
}

// Topic Paths
export const getTopicPaths = async (): Promise<TopicPath[]> => {
  try {
    const snapshot = await topicPathsRef.orderBy("difficulty").get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as TopicPath
    })
  } catch (error) {
    console.error("Error fetching topic paths:", error)
    throw error
  }
}

export async function getRelatedContent(
  goalIds: string[]
): Promise<RelatedContent[]> {
  try {
    // Get all topics related to user's goals
    const topicsRef = collection(db, "topics")
    const topicsSnapshot = await getDocs(
      query(
        topicsRef,
        where("tags", "array-contains-any", goalIds),
        orderBy("trendingScore", "desc"),
        limit(10)
      )
    )

    const content: RelatedContent[] = []
    topicsSnapshot.forEach((doc) => {
      const topic = doc.data()
      // Convert each video to RelatedContent
      if (topic.videos) {
        content.push(
          ...topic.videos.map((video: any) => ({
            id: video.id,
            type: "video" as const,
            title: video.title,
            description: video.description || "",
            thumbnail: video.thumbnail,
            tags: video.tags || [],
            relevanceScore: topic.trendingScore || 0,
            duration: video.duration,
            viewCount: video.viewCount,
            likes: video.likes,
            createdAt: video.createdAt?.toDate(),
          }))
        )
      }
    })

    return content.sort((a, b) => b.relevanceScore - a.relevanceScore)
  } catch (error) {
    console.error("Error getting related content:", error)
    throw error
  }
}

export async function getTopicSuggestions(
  goalIds: string[]
): Promise<TopicSuggestion[]> {
  try {
    // Get topics that match user's goals
    const topicsRef = collection(db, "topics")
    const topicsSnapshot = await getDocs(
      query(
        topicsRef,
        where("tags", "array-contains-any", goalIds),
        orderBy("learnerCount", "desc"),
        limit(10)
      )
    )

    const suggestions: TopicSuggestion[] = []
    topicsSnapshot.forEach((doc) => {
      const topic = doc.data()
      suggestions.push({
        topicId: doc.id,
        relevanceScore: topic.learnerCount || 0,
        reason: `Popular among ${topic.learnerCount} learners`,
        basedOn: goalIds.map((id) => ({ type: "goal" as const, id })),
        tags: topic.tags || [],
        matchPercentage: calculateMatchPercentage(topic.tags, goalIds),
      })
    })

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)
  } catch (error) {
    console.error("Error getting topic suggestions:", error)
    throw error
  }
}

function calculateMatchPercentage(
  topicTags: string[],
  goalIds: string[]
): number {
  const matchingTags = topicTags.filter((tag) => goalIds.includes(tag))
  return (matchingTags.length / goalIds.length) * 100
}
