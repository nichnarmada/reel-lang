# LearnLoop Database Structure

## Firebase Products Used

We'll utilize the following Firebase products for our database needs:

### Cloud Firestore

- Main database for user data, video metadata, and learning progress
- NoSQL document-based structure
- Real-time updates

### Firebase Storage

- Video content and thumbnail storage
- User profile images

### Firebase Authentication

- User authentication and management
- Social auth providers
- Session management

## Collection Structures

### Users Collection

```typescript
users/{userId} {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: timestamp
  lastActive: timestamp

  // Learning preferences
  interests: string[]  // Topics of interest
  expertiseLevels: {
    [topic: string]: 'beginner' | 'intermediate' | 'advanced'
  }

  // Gamification
  streak: number
  lastStreakUpdate: timestamp
  points: number
  achievements: string[]

  // Settings
  notifications: boolean
  autoplay: boolean
}
```

### Videos Collection

```typescript
videos/{videoId} {
  id: string
  title: string
  description: string
  topics: string[]  // Main topics covered
  difficulty: 'beginner' | 'intermediate' | 'advanced'

  // Media
  videoUrl: string
  thumbnailUrl: string
  duration: number

  // Content metadata
  tags: string[]
  categories: string[]
  transcriptUrl?: string

  // Stats
  views: number
  likes: number
  shares: number

  // Creator info
  creatorId: string
  createdAt: timestamp

  // Learning metadata
  keyPoints: string[]
  relatedTopics: string[]
}
```

### User Progress Collection

```typescript
users/{userId}/progress/{videoId} {
  videoId: string
  watched: boolean
  watchedDuration: number
  lastWatched: timestamp

  // Learning progress
  comprehensionScore?: number
  quizzes: {
    quizId: string
    score: number
    completedAt: timestamp
  }[]

  // User engagement
  liked: boolean
  saved: boolean
  notes?: string
}
```

### Topics Collection

```typescript
topics/{topicId} {
  name: string
  description: string
  parentTopic?: string
  subtopics: string[]
  relatedTopics: string[]

  // Topic metadata
  videoCount: number
  learnerCount: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}
```

### User Topic Progress Collection

```typescript
users/{userId}/topicProgress/{topicId} {
  topicId: string
  started: timestamp
  lastActivity: timestamp

  // Progress metrics
  videosWatched: number
  quizzesTaken: number
  averageScore: number
  masteryLevel: number // 0-100

  // Milestones
  achievements: {
    achievementId: string
    unlockedAt: timestamp
  }[]
}
```

### AI-Generated Content Collection

```typescript
videos/{videoId}/aiContent {
  quizzes: {
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
  }[]

  summary: {
    key_points: string[]
    main_concepts: string[]
    follow_up_topics: string[]
  }

  comprehensionMetrics: {
    difficulty_score: number
    prerequisites: string[]
    estimated_duration: number
  }
}
```

## Security Rules

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Videos
    match /videos/{videoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isCreator;
    }

    // Topics
    match /topics/{topicId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
  }
}
```

## Storage Structure

```
storage/
├── videos/
│   ├── {videoId}/
│   │   ├── source.mp4
│   │   └── thumbnail.jpg
├── users/
│   └── {userId}/
│       └── profile.jpg
```

## Required Indexes

```typescript
// Videos by topic and difficulty
videos: topics, difficulty

// Videos by popularity
videos: topics, views

// User progress by date
users/{userId}/progress: lastWatched

// Topic progress by mastery
users/{userId}/topicProgress: masteryLevel
```

## Caching Strategy

### Client-Side Caching

- Cache video metadata in local storage
- Store frequently accessed user data in memory
- Implement offline persistence for progress tracking
- Use Firebase Storage caching for video content

### Server-Side Caching

- Implement caching for frequently accessed videos
- Cache AI-generated content
- Cache user statistics and leaderboards

## Data Access Patterns

### Common Queries

- Fetch feed videos by topic and difficulty
- Get user's learning progress
- Retrieve topic mastery levels
- Access video metadata and summaries

### Write Patterns

- Update user progress after watching videos
- Track topic mastery
- Store quiz results
- Update engagement metrics

## Performance Considerations

1. Implement pagination for video feeds
2. Use composite indexes for complex queries
3. Optimize data structure for common access patterns
4. Implement proper cache invalidation
5. Monitor database usage and costs

## Backup Strategy

1. Regular Firestore backups
2. Export user data periodically
3. Backup media files in Storage
4. Maintain data consistency across backups
