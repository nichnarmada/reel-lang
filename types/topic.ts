import { Timestamp } from "firebase/firestore"

import { DifficultyLevel } from "."

export interface RelatedTopic {
  name: string
  emoji: string
}

export interface GeneratedTopic {
  name: string
  category: string
  description: string
  emoji: string
  reasonForSuggestion: string
  confidence: number
  searchTerms: string[]
  relatedTopics: RelatedTopic[]
  availableDifficulties: DifficultyLevel[]
  selectedDifficulty?: DifficultyLevel
  createdAt: Timestamp
  lastAccessed?: Timestamp
}
