import { DifficultyLevel, Timestamp } from "."

export interface UserProfile {
  name: string
  email: string
  photoURL?: string
  createdAt: Timestamp
  lastActive: Timestamp
}

export interface UserPreferences {
  defaultSessionLength: number // in minutes
  topicsOfInterest: string[]
  difficultyPreference: DifficultyLevel
}

export interface UserStats {
  totalLearningTime: number // in minutes
  sessionsCompleted: number
  topicsExplored: number
  averageQuizScore: number
}

export interface UserAchievement {
  achievementId: string
  unlockedAt: Timestamp
}

export interface User {
  uid: string
  profile: UserProfile
  preferences: UserPreferences
  stats: UserStats
  achievements: UserAchievement[]
}
