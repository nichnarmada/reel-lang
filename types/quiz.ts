import { DifficultyLevel, Timestamp } from "."

export interface Question {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  topicId: string
  videoReference: string // video ID this question was generated from
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
  topics: string[] // topic IDs covered
}

export interface Quiz {
  id: string
  sessionId: string
  userId: string
  questions: Question[]
  userResponses: UserResponse[]
  metadata: QuizMetadata
}
