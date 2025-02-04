export type DifficultyLevel = "beginner" | "intermediate" | "advanced"

export interface Achievement {
  id: string
  unlockedAt: Date
}

export interface TopicPreference {
  topicId: string
  difficulty: DifficultyLevel
  addedAt: Date
}

export interface Topic {
  id: string
  name: string
  description: string
  icon: string
  parentTopic?: string
  subtopics: string[]
  relatedTopics: string[]

  // Metadata
  videoCount: number
  learnerCount: number
  difficulty: DifficultyLevel

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface TopicProgress {
  topicId: string
  userId: string
  masteryLevel: number
  videosWatched: number
  quizzesTaken: number
  averageScore: number
  lastActivity: Date

  // Achievements for this topic
  achievements: Achievement[]
}

export interface UserTopicPreferences {
  userId: string
  selectedTopics: TopicPreference[]
  excludedTopics: string[] // Topics user has explicitly hidden/removed
}

// For the featured topics section
export interface FeaturedTopic extends Topic {
  featuredUntil: Date
  priority: number
  cardImage?: string
}

// For learning paths
export interface TopicPath {
  id: string
  name: string
  description: string
  topics: {
    topicId: string
    order: number
    requiredMasteryLevel: number
  }[]
  difficulty: DifficultyLevel
  estimatedDuration: number // in minutes
  videoCount: number
  quizCount: number
}

// For topic discovery
export interface TopicSuggestion {
  topicId: string
  relevanceScore: number
  reason: string
  basedOn: string[] // topicIds that led to this suggestion
}
