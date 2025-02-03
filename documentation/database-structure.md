# ReelLang Database Structure

## Firebase Products Used

We'll utilize the following Firebase products for our database needs:

### Cloud Firestore

- Main database for user data, video metadata, and learning progress
- NoSQL document-based structure
- Real-time updates

### Firebase Storage

- Video content and thumbnail storage
- Captions and transcripts
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
  nativeLanguage: string
  learningLanguages: string[]
  proficiencyLevels: {
    [language: string]: 'beginner' | 'intermediate' | 'advanced'
  }

  // Gamification
  streak: number
  lastStreakUpdate: timestamp
  points: number
  achievements: string[]

  // Settings
  notifications: boolean
  autoplay: boolean
  captionsEnabled: boolean
}
```

### Videos Collection

```typescript
videos/{videoId} {
  id: string
  title: string
  description: string
  language: string
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced'

  // Media
  videoUrl: string
  thumbnailUrl: string
  duration: number

  // Content metadata
  tags: string[]
  categories: string[]
  transcriptUrl: string
  captions: {
    [language: string]: string // URL to captions file
  }

  // Stats
  views: number
  likes: number
  shares: number

  // Creator info
  creatorId: string
  createdAt: timestamp

  // Learning metadata
  vocabularyWords: {
    word: string
    translation: string
    timestamp: number // when word appears in video
  }[]
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
  learnedWords: {
    word: string
    learned: boolean
    lastReviewed: timestamp
    confidence: number // 0-1
  }[]

  // Quiz results
  quizzes: {
    quizId: string
    score: number
    completedAt: timestamp
  }[]
}
```

### User Study List Collection

```typescript
users/{userId}/studyList/{videoId} {
  videoId: string
  addedAt: timestamp
  priority: number
  notes?: string
}
```

### Vocabulary Collection

```typescript
users/{userId}/vocabulary/{wordId} {
  word: string
  language: string
  translation: string
  context: {
    videoId: string
    timestamp: number
    sentence: string
  }[]

  // Spaced repetition data
  learned: boolean
  confidence: number
  lastReviewed: timestamp
  nextReview: timestamp
  reviewCount: number
}
```

### AI-Generated Content Collection

```typescript
videos/{videoId}/aiContent {
  flashcards: {
    front: string
    back: string
    example: string
  }[]

  quizzes: {
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
  }[]

  summary: {
    key_points: string[]
    vocabulary_focus: string[]
    grammar_points: string[]
  }
}
```

## Security Rules

```typescript
// Example Firestore security rules
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

    // User progress
    match /users/{userId}/progress/{document=**} {
      allow read, write: if request.auth.uid == userId;
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
│   │   ├── thumbnail.jpg
│   │   └── captions/
│   │       ├── en.vtt
│   │       └── es.vtt
├── users/
│   └── {userId}/
│       └── profile.jpg
```

## Required Indexes

```typescript
// Videos by language and proficiency
videos: language, proficiencyLevel

// Videos by popularity
videos: language, views

// User progress by date
users/{userId}/progress: lastWatched

// Vocabulary by next review date
users/{userId}/vocabulary: nextReview, confidence
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

- Fetch feed videos by language and proficiency
- Get user's learning progress
- Retrieve vocabulary for review
- Access video metadata and transcripts

### Write Patterns

- Update user progress after watching videos
- Save vocabulary items
- Track user engagement metrics
- Store quiz results

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
