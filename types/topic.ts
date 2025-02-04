import { DifficultyLevel } from "."

export interface Topic {
  id: string
  name: string
  description: string
  category: string
  relatedTopics: string[] // references to other topic IDs
  availableDifficulties: DifficultyLevel[] // available difficulty levels for this topic
  searchTerms: string[] // for better search functionality
  popularity: number // for trending topics
}
