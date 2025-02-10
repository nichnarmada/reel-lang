import { DifficultyLevel, Timestamp } from "."
import { VideoSegmentType } from "./content"
import { Session, SessionDuration } from "./session"
import { GeneratedContent } from "./content"

export interface UserProgress {
  videosWatched: number
  timeSpentSeconds: number
  completedSegments: string[]
}

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  topicId: string
  videoReference?: string // Optional now as we might generate from content instead
  segmentType?: VideoSegmentType // New field for content-based questions
  conceptId?: string // New field for content-based questions
}

export interface UserResponse {
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
  timeSpent: number
}

export interface QuizMetadata {
  generatedAt: Timestamp
  difficulty: DifficultyLevel
  topics: string[]
  segmentBreakdown?: {
    core: number
    quick: number
    recap: number
  }
  userProgress?: UserProgress
}

export interface Quiz {
  id: string
  sessionId: string
  userId: string
  questions: Question[]
  userResponses: UserResponse[]
  metadata: QuizMetadata
}

// Context type for quiz generation
export interface QuizGenerationContext {
  session: Session
  content: GeneratedContent
  userProgress: UserProgress
}

export interface QuizRequirements {
  minQuestions: number
  maxQuestions: number
  questionsPerConcept: number
}

export interface QuestionGenerationStrategy {
  core: number // Questions per core concept
  quick: number // Questions per quick concept
  recap: number // Questions per recap concept
}

export const getQuizRequirements = (
  duration: SessionDuration
): QuizRequirements => {
  switch (duration) {
    case 1:
      return {
        minQuestions: 2,
        maxQuestions: 3,
        questionsPerConcept: 1,
      }
    case 5:
      return {
        minQuestions: 3,
        maxQuestions: 5,
        questionsPerConcept: 1,
      }
    case 10:
      return {
        minQuestions: 5,
        maxQuestions: 7,
        questionsPerConcept: 2,
      }
    case 15:
      return {
        minQuestions: 7,
        maxQuestions: 10,
        questionsPerConcept: 2,
      }
    default:
      return {
        minQuestions: 5,
        maxQuestions: 7,
        questionsPerConcept: 1,
      }
  }
}

export const getGenerationStrategy = (
  duration: SessionDuration
): QuestionGenerationStrategy => {
  switch (duration) {
    case 1:
      return {
        core: 0, // No core concepts in 1-min
        quick: 1, // One per quick segment
        recap: 0, // No recap in 1-min
      }
    case 5:
      return {
        core: 1, // One per core concept
        quick: 1, // One per quick insight
        recap: 1, // One summary question
      }
    case 10:
      return {
        core: 2, // Two per core concept
        quick: 1, // One per quick insight
        recap: 1, // One summary question
      }
    case 15:
      return {
        core: 2, // Two per core concept
        quick: 2, // Two per quick insight
        recap: 1, // One summary question
      }
    default:
      return {
        core: 1,
        quick: 1,
        recap: 1,
      }
  }
}
