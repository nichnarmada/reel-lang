import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

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

interface SessionAnalytics {
  actualDuration: number // in seconds
  pauseCount: number
  timeOfDay: "morning" | "afternoon" | "evening" | "night"
  dayOfWeek: number // 0-6 for Sunday-Saturday
  completionRate: number // percentage of planned duration completed
}

interface Session {
  id: string
  userId: string
  topicId: string
  topicName: string
  status: "active" | "completed" | "paused"
  startTime: admin.firestore.Timestamp
  completedAt?: admin.firestore.Timestamp
  pausedAt?: admin.firestore.Timestamp
  resumedAt?: admin.firestore.Timestamp
  duration: number // in minutes
  progress?: {
    timeSpentSeconds: number
    videosWatched: number
    remainingTimeSeconds: number
  }
  analytics?: SessionAnalytics
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
  );

  if (existingTopicIndex !== -1) {
    const topic = currentProgress.explored[existingTopicIndex];
    currentProgress.explored[existingTopicIndex] = {
      ...topic,
      timeSpent: topic.timeSpent + timeSpent,
      lastAccessed: admin.firestore.Timestamp.now(),
    };
  } else {
    currentProgress.explored.push({
      topicId: sessionData.topicId,
      topicName: sessionData.topicName,
      parentTopic: sessionData.parentTopic,
      timeSpent: timeSpent,
      lastAccessed: admin.firestore.Timestamp.now(),
      subTopics: [],
    });
  }

  currentProgress.recentlyActive = [
    sessionData.topicId,
    ...currentProgress.recentlyActive.filter(
      (id) => id !== sessionData.topicId
    ),
  ].slice(0, 5);

  return currentProgress;
}

function updateStreaks(
  currentStreaks: UserStats["learningStreaks"]
): UserStats["learningStreaks"] {
  const today = new Date().toISOString().split("T")[0];
  const lastActive = new Date(currentStreaks.lastActiveDate);
  const daysDiff = Math.floor(
    (new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newCurrent = currentStreaks.current;
  if (daysDiff === 1) {
    newCurrent += 1;
  } else if (daysDiff > 1) {
    newCurrent = 1;
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
  };
}

function updateWeeklyProgress(
  currentProgress: UserStats["weeklyProgress"],
  timeSpent: number
): UserStats["weeklyProgress"] {
  const today = new Date().getDay();
  const newTimes = [...currentProgress.timeSpent];
  newTimes[today] = (newTimes[today] || 0) + timeSpent;

  return {
    timeSpent: newTimes,
  };
}

function calculateActualDuration(session: Session): number {
  if (!session.completedAt) {
    return session.progress?.timeSpentSeconds || 0;
  }
  return (
    session.progress?.timeSpentSeconds ||
    session.completedAt.seconds - session.startTime.seconds
  );
}

function calculatePauseCount(session: Session): number {
  if (!session.pausedAt) return 0;
  // If we have both pausedAt and resumedAt, it means the session was paused and resumed
  return session.pausedAt && session.resumedAt ? 1 : 0;
}

function getTimeOfDay(
  timestamp: admin.firestore.Timestamp
): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date(timestamp.seconds * 1000).getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function calculateCompletionRate(session: Session): number {
  const planned = session.duration * 60; // convert minutes to seconds
  const actual = session.progress?.timeSpentSeconds || 0;
  return Math.min((actual / planned) * 100, 100); // Cap at 100%
}

export const onQuizComplete = onDocumentWritten(
  "quizzes/{quizId}",
  async (event) => {
    const newData = event.data?.after?.data() as Quiz | undefined;
    const oldData = event.data?.before?.data() as Quiz | undefined;

    if (
      !newData ||
      oldData?.userResponses?.length === newData?.userResponses?.length
    ) {
      return null;
    }

    const userId = newData.userId;
    const totalTimeSpent = newData.userResponses.reduce(
      (sum, response) => sum + response.timeSpent,
      0
    );

    const sessionDoc = await admin
      .firestore()
      .collection("sessions")
      .doc(newData.sessionId)
      .get();

    if (!sessionDoc.exists) {
      console.error(`Session ${newData.sessionId} not found`);
      return null;
    }

    const sessionData = sessionDoc.data() as {
      topicId: string
      topicName: string
      parentTopic?: string
    };

    const userRef = admin.firestore().collection("users").doc(userId);

    return admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        console.error(`User ${userId} not found`);
        return null;
      }

      const currentStats = userDoc.data()?.stats as UserStats;

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
      };

      transaction.set(userRef, {stats: newStats}, {merge: true});
      return newStats;
    });
  }
);

export const onSessionStatusChange = onDocumentWritten(
  "sessions/{sessionId}",
  async (event) => {
    const newData = event.data?.after?.data() as Session | undefined;
    const oldData = event.data?.before?.data() as Session | undefined;

    // Return if no data or if status hasn't changed
    if (!newData || newData.status === oldData?.status) {
      return null;
    }

    // Only process completed or paused sessions
    if (newData.status !== "completed" && newData.status !== "paused") {
      return null;
    }

    const sessionAnalytics: SessionAnalytics = {
      actualDuration: calculateActualDuration(newData),
      pauseCount: calculatePauseCount(newData),
      timeOfDay: getTimeOfDay(newData.startTime),
      dayOfWeek: new Date(newData.startTime.seconds * 1000).getDay(),
      completionRate: calculateCompletionRate(newData),
    };

    const batch = admin.firestore().batch();

    // Update session with analytics
    const sessionRef = admin.firestore().collection("sessions").doc(newData.id);
    batch.set(sessionRef, {analytics: sessionAnalytics}, {merge: true});

    // If session is completed, update user stats
    if (newData.status === "completed") {
      const userRef = admin.firestore().collection("users").doc(newData.userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const currentStats = userData?.stats as UserStats;

        // Update user stats
        const newStats: UserStats = {
          ...currentStats,
          totalLearningTime:
            currentStats.totalLearningTime +
            sessionAnalytics.actualDuration / 60, // Convert to minutes
          sessionsCompleted: currentStats.sessionsCompleted + 1,
          topicsProgress: updateTopicProgress(
            currentStats.topicsProgress,
            {
              topicId: newData.topicId,
              topicName: newData.topicName,
            },
            sessionAnalytics.actualDuration / 60 // Convert to minutes
          ),
          learningStreaks: updateStreaks(currentStats.learningStreaks),
          weeklyProgress: updateWeeklyProgress(
            currentStats.weeklyProgress,
            sessionAnalytics.actualDuration / 60 // Convert to minutes
          ),
        };

        batch.set(userRef, {stats: newStats}, {merge: true});
      }
    }

    // Commit all updates
    return batch.commit();
  }
);
