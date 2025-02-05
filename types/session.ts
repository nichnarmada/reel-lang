import { Timestamp } from "."

export type SessionStatus = "active" | "completed" | "paused"

export interface Session {
  id: string
  userId: string
  topicId: string
  topicName: string // Denormalized for UI convenience
  status: SessionStatus
  startTime: Timestamp
  completedAt?: Timestamp
  duration: number // in minutes
}
