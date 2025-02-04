import { DifficultyLevel } from "./topic"

export interface Quiz {
  id: string
  topic: string
  title: string
  description: string
  questionCount: number
  estimatedTime: string
  difficulty: DifficultyLevel
  progress: number
}

export interface Question {
  id: string
  quizId: string
  text: string
  options: string[]
  correctOption: number
  explanation: string
}

export interface QuizProgress {
  userId: string
  quizId: string
  completed: boolean
  score: number
  startedAt: Date
  completedAt?: Date
  answers: {
    questionId: string
    selectedOption: number
    correct: boolean
  }[]
}
