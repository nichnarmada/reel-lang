import { DifficultyLevel, Timestamp } from "."
import { Topic } from "./topic"

export interface TopicGenerationInput {
  userId: string
  preferredCategories: string[]
  skillLevels: Record<string, DifficultyLevel>
  exploredTopics?: string[]
  topicsPerCategory?: number
}

export interface GeneratedTopicSuggestion extends Omit<Topic, "id"> {
  emoji?: string // Optional emoji for the topic
  confidence: number
  reasonForSuggestion: string
  suggestedAt: Timestamp
}

export interface TopicSuggestionCache {
  userId: string
  categoryId: string
  suggestions: GeneratedTopicSuggestion[]
  generatedAt: Timestamp
  expiresAt: Timestamp
}

export interface PromptContext {
  category: string
  userSkillLevel: DifficultyLevel
  previousTopics: string[]
}
