import { Timestamp } from "."

export interface VideoMetadata {
  source: string
  author: string
  uploadDate: Timestamp
}

export interface VideoEngagement {
  views: number
  saves: number
  shares: number
  completionRate: number
}

export interface Video {
  id: string
  title: string
  description: string
  duration: number // in seconds
  url: string
  thumbnailUrl: string
  topicIds: string[] // references to topics
  transcript: string // for quiz generation
  keyPoints: string[] // main concepts covered
  metadata: VideoMetadata
  engagement: VideoEngagement
}
