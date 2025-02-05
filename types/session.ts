import { Timestamp } from "."

export type SessionStatus = "active" | "completed" | "paused"

export interface SessionConfig {
  duration: number // in minutes
  startTime: Timestamp
  endTime: Timestamp
  status: SessionStatus
}

export interface WatchHistory {
  videoId: string
  watchedDuration: number
  timestamp: Timestamp
}

export interface QuizResults {
  score: number
  totalQuestions: number
  timeSpent: number
}

export interface Session {
  id: string
  userId: string
  topicId: string
  config: SessionConfig
  watchHistory: WatchHistory[]
  quizResults: QuizResults
}
