import { DifficultyLevel } from "."

export interface TopicCategory {
  id: string
  name: string
  description: string
  iconName: string // for UI display
  color: string // for UI theming
  parentCategory?: string // for sub-categories
}

export interface Topic {
  id: string
  name: string
  description: string
  category: string
  categoryPath: string[] // Full path of categories (for hierarchical structure)
  relatedTopics: string[] // references to other topic IDs
  availableDifficulties: DifficultyLevel[] // available difficulty levels for this topic
  searchTerms: string[] // for better search functionality
  popularity: number // for trending topics
  iconName?: string
  prerequisites?: string[] // Topics recommended before this one
  estimatedTimeToMaster?: number // in minutes
}
