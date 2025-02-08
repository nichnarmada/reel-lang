import { onDocumentWritten } from "firebase-functions/v2/firestore"
import * as admin from "firebase-admin"

admin.initializeApp()

interface UserResponse {
  questionId: string
  selectedAnswer: string
  timeSpent: number
}

interface Quiz {
  id: string
  userId: string
  sessionId: string
  questions: any[]
  userResponses: UserResponse[]
  metadata: {
    generatedAt: admin.firestore.Timestamp
    topics: string[]
  }
}

interface UserStats {
  totalLearningTime: number
  sessionsCompleted: number
  topicsProgress: {
    explored: {
      topicId: string
      topicName: string
      parentTopic?: string
      timeSpent: number
      lastAccessed: admin.firestore.Timestamp
      subTopics?: string[]
    }[]
    recentlyActive: string[]
  }
  learningStreaks: {
    current: number
    longest: number
    lastActiveDate: string
    weeklyActivity: Record<string, number>
  }
  weeklyProgress: {
    timeSpent: number[]
  }
}

function updateTopicProgress(
  currentProgress: UserStats["topicsProgress"],
  sessionData: { topicId: string; topicName: string; parentTopic?: string },
  timeSpent: number
) {
  const existingTopicIndex = currentProgress.explored.findIndex(
    (t) => t.topicId === sessionData.topicId
  )

  if (existingTopicIndex !== -1) {
    const topic = currentProgress.explored[existingTopicIndex]
    currentProgress.explored[existingTopicIndex] = {
      ...topic,
      timeSpent: topic.timeSpent + timeSpent,
      lastAccessed: admin.firestore.Timestamp.now(),
    }
  } else {
    currentProgress.explored.push({
      topicId: sessionData.topicId,
      topicName: sessionData.topicName,
      parentTopic: sessionData.parentTopic,
      timeSpent: timeSpent,
      lastAccessed: admin.firestore.Timestamp.now(),
      subTopics: [],
    })
  }

  currentProgress.recentlyActive = [
    sessionData.topicId,
    ...currentProgress.recentlyActive.filter(
      (id) => id !== sessionData.topicId
    ),
  ].slice(0, 5)

  return currentProgress
}

function updateStreaks(
  currentStreaks: UserStats["learningStreaks"]
): UserStats["learningStreaks"] {
  const today = new Date().toISOString().split("T")[0]
  const lastActive = new Date(currentStreaks.lastActiveDate)
  const daysDiff = Math.floor(
    (new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  )

  let newCurrent = currentStreaks.current
  if (daysDiff === 1) {
    newCurrent += 1
  } else if (daysDiff > 1) {
    newCurrent = 1
  }

  return {
    ...currentStreaks,
    current: newCurrent,
    longest: Math.max(currentStreaks.longest, newCurrent),
    lastActiveDate: today,
    weeklyActivity: {
      ...currentStreaks.weeklyActivity,
      [today]: (currentStreaks.weeklyActivity[today] || 0) + 1,
    },
  }
}

function updateWeeklyProgress(
  currentProgress: UserStats["weeklyProgress"],
  timeSpent: number
): UserStats["weeklyProgress"] {
  const today = new Date().getDay()
  const newTimes = [...currentProgress.timeSpent]
  newTimes[today] = (newTimes[today] || 0) + timeSpent

  return {
    timeSpent: newTimes,
  }
}

export const onQuizComplete = onDocumentWritten(
  "quizzes/{quizId}",
  async (event) => {
    const newData = event.data?.after?.data() as Quiz | undefined
    const oldData = event.data?.before?.data() as Quiz | undefined

    if (
      !newData ||
      oldData?.userResponses?.length === newData?.userResponses?.length
    ) {
      return null
    }

    const userId = newData.userId
    const totalTimeSpent = newData.userResponses.reduce(
      (sum, response) => sum + response.timeSpent,
      0
    )

    const sessionDoc = await admin
      .firestore()
      .collection("sessions")
      .doc(newData.sessionId)
      .get()

    if (!sessionDoc.exists) {
      console.error(`Session ${newData.sessionId} not found`)
      return null
    }

    const sessionData = sessionDoc.data() as {
      topicId: string
      topicName: string
      parentTopic?: string
    }

    const userRef = admin.firestore().collection("users").doc(userId)

    return admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef)

      if (!userDoc.exists) {
        console.error(`User ${userId} not found`)
        return null
      }

      const currentStats = userDoc.data()?.stats as UserStats

      const newStats: UserStats = {
        ...currentStats,
        totalLearningTime: currentStats.totalLearningTime + totalTimeSpent,
        sessionsCompleted: currentStats.sessionsCompleted + 1,
        topicsProgress: updateTopicProgress(
          currentStats.topicsProgress,
          sessionData,
          totalTimeSpent
        ),
        learningStreaks: updateStreaks(currentStats.learningStreaks),
        weeklyProgress: updateWeeklyProgress(
          currentStats.weeklyProgress,
          totalTimeSpent
        ),
      }

      transaction.set(userRef, { stats: newStats }, { merge: true })

      const analyticsData = {
        user_id: userId,
        session_id: newData.sessionId,
        topic_id: sessionData.topicId,
        topic_name: sessionData.topicName,
        time_spent: totalTimeSpent,
        sessions_completed: newStats.sessionsCompleted,
      }

      return newStats
    })
  }
)
