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
  category: string
  tags: string[]

  // Metadata
  videoCount: number
  learnerCount: number
  difficulty: DifficultyLevel
  estimatedDuration: number // in hours
  completionRate: number
  trendingScore?: number // For trending topics
  expertCount?: number // Number of experts in this topic

  // Learning content
  videos?: {
    id: string
    title: string
    thumbnail: string
    duration: number
    tags: string[]
    viewCount: number
    likes: number
  }[]

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

export interface LearningGoal {
  id: string
  userId: string
  title: string
  category?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  progress?: number
  relatedTopics?: string[]
}

export interface UserTopicPreferences {
  userId: string
  learningGoals: LearningGoal[]
  selectedTopics: {
    topicId: string
    difficulty: DifficultyLevel
    addedAt: Date
    goalId?: string // Associate topic with a learning goal
  }[]
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
  category: string
  thumbnail?: string
  topics: {
    topicId: string
    order: number
    requiredMasteryLevel: number
  }[]
  difficulty: DifficultyLevel
  estimatedDuration: number // in minutes
  videoCount: number
  quizCount: number
  tags: string[]
  completionCount: number // How many users completed this path
  rating?: number // Average user rating
}

// For topic discovery
export interface TopicSuggestion {
  topicId: string
  relevanceScore: number
  reason: string
  basedOn: {
    type: "goal" | "topic" | "interest"
    id: string
  }[]
  tags: string[]
  matchPercentage?: number // How well it matches user's interests
}

export interface RelatedContent {
  id: string
  type: "video" | "path" | "topic"
  title: string
  description: string
  thumbnail?: string
  tags: string[]
  relevanceScore: number
  goalId?: string // Which learning goal this content is related to
  duration?: number // Duration in seconds for videos
  viewCount?: number
  likes?: number
  createdAt: Date
}
