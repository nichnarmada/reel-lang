import { DifficultyLevel } from "."
import { Timestamp } from "firebase/firestore"

export interface GeneratedTopic {
  name: string
  category: string
  description: string
  emoji: string
  reasonForSuggestion: string
  confidence: number
  searchTerms: string[]
  relatedTopics: string[]
  availableDifficulties: DifficultyLevel[]
  selectedDifficulty?: DifficultyLevel
  createdAt: Timestamp
  lastAccessed?: Timestamp
}
