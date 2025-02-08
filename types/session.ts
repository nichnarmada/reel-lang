import { Timestamp } from "."

export type SessionStatus = "active" | "completed" | "paused"

export type SessionDuration = 1 | 5 | 10 | 15

export interface SessionProgress {
  lastVideoId?: string
  lastVideoTimestamp?: number // in seconds
  timeSpentSeconds: number // in seconds
  videosWatched: number
  remainingTimeSeconds: number // in seconds
}

export interface Session {
  id: string
  userId: string
  topicId: string
  topicName: string // Denormalized for UI convenience
  status: SessionStatus
  startTime: Timestamp
  completedAt?: Timestamp
  pausedAt?: Timestamp
  resumedAt?: Timestamp
  duration: number // in minutes
  progress?: SessionProgress
  topicEmoji?: string // Optional emoji for visual representation
}
