import { Timestamp } from "."
import { GeneratedTopic } from "./topic"

export interface TopicGenerationInput {
  userId: string
  preferredCategories: string[]
  exploredTopics?: string[]
  topicsPerCategory?: number
  topicNumber?: number
}

export interface GeneratedTopicSuggestion extends Omit<GeneratedTopic, "id"> {
  emoji: string // Emoji for the topic
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
  previousTopics: string[]
  topicNumber: number
}
