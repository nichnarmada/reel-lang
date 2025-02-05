# Database Structure

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
users: {
  uid: string;
  profile: {
    name: string;
    email: string;
    photoURL?: string;
    createdAt: timestamp;
    lastActive: timestamp;
  };
  preferences: {
    defaultSessionLength: number; // in minutes
    topicsOfInterest: string[];
    difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
  };
  stats: {
    totalLearningTime: number; // in minutes
    sessionsCompleted: number;
    topicsExplored: number;
    averageQuizScore: number;
  };
  achievements: {
    achievementId: string;
    unlockedAt: timestamp;
  }[];
}
```

### Saved Videos Collection

```typescript
savedVideos: {
  id: string
  userId: string // reference to user
  videoId: string // reference to video
  title: string
  description: string
  thumbnail: string
  duration: string
  topicId: string
  topicName: string
  savedAt: string
}
```

### Topics Collection

```typescript
topics: {
  id: string;
  name: string;
  description: string;
  category: string;
  relatedTopics: string[]; // references to other topic IDs
  difficultyLevels: {
    beginner: boolean;
    intermediate: boolean;
    advanced: boolean;
  };
  searchTerms: string[]; // for better search functionality
  popularity: number; // for trending topics
}
```

### Videos Collection

```typescript
videos: {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  url: string;
  thumbnailUrl: string;
  topicIds: string[]; // references to topics
  transcript: string; // for quiz generation
  keyPoints: string[]; // main concepts covered
  metadata: {
    source: string;
    author: string;
    uploadDate: timestamp;
  };
  engagement: {
    views: number;
    saves: number;
    shares: number;
    completionRate: number;
  };
}
```

### Sessions Collection

```typescript
sessions: {
  id: string
  userId: string
  topicId: string
  config: {
    duration: number // in minutes
    startTime: timestamp
    endTime: timestamp
    status: "active" | "completed" | "paused"
  }
  watchHistory: {
    videoId: string
    watchedDuration: number
    timestamp: timestamp
  }
  ;[]
  quizResults: {
    score: number
    totalQuestions: number
    timeSpent: number
  }
}
```

### Quizzes Collection

```typescript
quizzes: {
  id: string;
  sessionId: string;
  userId: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    topicId: string;
    videoReference: string; // video ID this question was generated from
  }[];
  userResponses: {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];
  metadata: {
    generatedAt: timestamp;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topics: string[]; // topic IDs covered
  };
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
    }

    // Topics
    match /topics/{topicId} {
      allow read: if request.auth != null;
    }

    // Sessions
    match /sessions/{sessionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    // Quizzes
    match /quizzes/{quizId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    // Saved Videos
    match /savedVideos/{videoId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```
