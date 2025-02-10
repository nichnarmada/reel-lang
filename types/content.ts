import { DifficultyLevel, Timestamp } from "."
import { SessionDuration } from "./session"

export type VideoSegmentType = "core" | "quick" | "recap"

export interface SegmentDurationGuide {
  type: VideoSegmentType
  targetDuration: number // in seconds
  order: number
}

export interface EducationalConcept {
  id: string
  name: string
  description: string
  keyPoints: string[]
  examples: string[]
  importance: number // 0 to 1, helps prioritize content
  segmentType: VideoSegmentType // indicates what type of video should cover this concept
}

export interface EducationalStructure {
  concepts: EducationalConcept[]
  learningObjectives: string[]
  prerequisites: string[]
  difficulty: DifficultyLevel
  segmentPlan: SegmentDurationGuide[]
}

export interface VideoSegmentScript {
  id: string
  order: number
  conceptIds: string[]
  segmentType: VideoSegmentType
  script: {
    text: string
    visualCues: string[]
    duration: number // in seconds
    hooks: string
  }
  keyPoints: string[]
  targetDuration: number
}

export interface GeneratedContent {
  id: string
  topicId: string
  structure: EducationalStructure
  videoScripts: VideoSegmentScript[]
  metadata: {
    generatedAt: Timestamp
    difficulty: DifficultyLevel
    version: string
    sessionDuration: SessionDuration
    totalDuration: number
    segmentBreakdown: {
      core: number
      quick: number
      recap: number
    }
  }
}

// Helper functions for duration calculations
export const calculateSegmentPlan = (
  duration: SessionDuration
): SegmentDurationGuide[] => {
  switch (duration) {
    case 1:
      // Two focused 30-second videos
      return [
        { type: "quick", targetDuration: 30, order: 1 },
        { type: "quick", targetDuration: 30, order: 2 },
      ]
    case 5:
      // Mix of core and quick insights
      return [
        { type: "core", targetDuration: 60, order: 1 },
        { type: "quick", targetDuration: 30, order: 2 },
        { type: "core", targetDuration: 60, order: 3 },
        { type: "quick", targetDuration: 30, order: 4 },
        { type: "recap", targetDuration: 30, order: 5 },
      ]
    case 10:
      // Balanced mix of all types
      return [
        { type: "core", targetDuration: 75, order: 1 },
        { type: "quick", targetDuration: 30, order: 2 },
        { type: "core", targetDuration: 75, order: 3 },
        { type: "quick", targetDuration: 30, order: 4 },
        { type: "core", targetDuration: 75, order: 5 },
        { type: "quick", targetDuration: 30, order: 6 },
        { type: "recap", targetDuration: 30, order: 7 },
        { type: "quick", targetDuration: 30, order: 8 },
        { type: "recap", targetDuration: 30, order: 9 },
      ]
    case 15:
      // Comprehensive mix with regular recaps
      return [
        { type: "core", targetDuration: 90, order: 1 },
        { type: "quick", targetDuration: 30, order: 2 },
        { type: "core", targetDuration: 90, order: 3 },
        { type: "quick", targetDuration: 30, order: 4 },
        { type: "recap", targetDuration: 30, order: 5 },
        { type: "core", targetDuration: 90, order: 6 },
        { type: "quick", targetDuration: 30, order: 7 },
        { type: "core", targetDuration: 90, order: 8 },
        { type: "quick", targetDuration: 30, order: 9 },
        { type: "recap", targetDuration: 30, order: 10 },
        { type: "quick", targetDuration: 30, order: 11 },
        { type: "recap", targetDuration: 30, order: 12 },
      ]
    default:
      return []
  }
}

export const getSegmentTypeDescription = (type: VideoSegmentType): string => {
  switch (type) {
    case "core":
      return "In-depth explanation of main concepts"
    case "quick":
      return "Quick, focused insights"
    case "recap":
      return "Brief summary and key takeaways"
  }
}
