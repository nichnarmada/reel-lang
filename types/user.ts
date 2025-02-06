import { DifficultyLevel, Timestamp } from "."
import { GeneratedTopic } from "./topic"

export interface UserProfile {
  name: string
  email: string
  photoURL?: string
  createdAt: Timestamp
  lastActive: Timestamp
}

export interface UserPreferences {
  defaultSessionLength: number // in minutes
  onboarding: OnboardingData | null // null if onboarding not completed
  preferredCategories: string[] // High-level categories for discovery
  learningGoals: string[]
}

// Collection: users/{userId}/generatedTopics/{topicId}
export interface UserGeneratedTopic extends GeneratedTopic {
  id: string // The document ID
  userId: string // Reference to the user who generated this topic
}

export interface TopicProgress {
  topicId: string
  topicName: string
  timeSpent: number // in minutes
  lastAccessed: Timestamp
}

export interface UserStats {
  totalLearningTime: number // in minutes
  sessionsCompleted: number
  topicsProgress: {
    explored: TopicProgress[] // All topics the user has interacted with
    recentlyActive: string[] // Last 5 active topic IDs for quick access
  }
  quizStats: {
    totalQuizzes: number
    averageScore: number
    bestScore: number
    completionRate: number
  }
  learningStreaks: {
    current: number
    longest: number
    lastActiveDate: string
    weeklyActivity: Record<string, number> // date -> activity count for heatmap
  }
  weeklyProgress: {
    timeSpent: number[] // array of 7 numbers for weekly graph
  }
}

export interface UserAchievement {
  achievementId: string
  unlockedAt: Timestamp
}

export interface SavedVideo {
  id: string
  userId: string
  videoId: string
  title: string
  description: string
  thumbnail: string
  duration: string
  topicId: string
  topicName: string
  savedAt: string
}

export interface User {
  uid: string
  profile: UserProfile
  preferences: UserPreferences
  stats: UserStats
  achievements: UserAchievement[]
}

// New interface for onboarding data
export interface OnboardingData {
  completedAt: Timestamp
  selectedInterests: {
    categoryId: string
    subInterests: string[]
  }[]
}
