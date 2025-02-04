import { DifficultyLevel } from "./topic"

export interface Video {
  id: string
  url: string
  thumbnailUrl: string
  caption: string
  language: string
  proficiencyLevel: DifficultyLevel
  duration: number
  metadata: {
    title: string
    description: string
    tags: string[]
    uploadedAt: Date
    creator: string
  }
  captions: {
    text: string
    startTime: number
    endTime: number
  }[]
}

export interface VideoPlayerProps {
  video: Video
  autoPlay?: boolean
  onComplete?: () => void
  onError?: (error: Error) => void
}
