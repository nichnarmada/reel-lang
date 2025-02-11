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

### Firebase Analytics

- User engagement tracking
- Video interaction analytics
- Learning progress metrics
- See [Firebase Analytics Documentation](./firebase-analytics.md) for detailed event tracking

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

### Video Reactions Collection

```typescript
videoReactions: {
  id: string
  userId: string
  videoId: string
  type: "like" | "dislike"
  createdAt: timestamp
  updatedAt: timestamp
  topicId: string // for analytics grouping
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
  id: string;
  userId: string;
  topicId: string;
  topicName: string; // Denormalized for UI convenience
  status: "active" | "completed" | "paused";
  startTime: timestamp;
  completedAt?: timestamp;
  duration: number; // in minutes
  progress?: {
    timeSpentSeconds: number;
    videosWatched: number;
    remainingTimeSeconds: number;
    lastVideoId?: string;
    lastVideoTimestamp?: number;
  };
  topicEmoji?: string;
}

// Session Subcollections
sessions/{sessionId}/content: {
  structure: GeneratedContent // Educational structure and metadata
}

sessions/{sessionId}/scripts: {
  videoScripts: VideoSegmentScript[] // Generated video scripts
}

sessions/{sessionId}/quiz: {
  questions: {
    id: string;
    sessionId: string;
    userId: string;
    questions: {
      id: string;
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      segmentType: "core" | "quick" | "recap";
      conceptId: string;
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
      topics: string[];
      segmentBreakdown: {
        core: number;
        quick: number;
        recap: number;
      };
      userProgress: {
        videosWatched: number;
        timeSpentSeconds: number;
        completedSegments: string[];
      };
    };
  }
}
```

Note: Video engagement tracking (views, watch duration, completion) is handled by Firebase Analytics rather than Firestore. This provides better performance and built-in analytics capabilities while keeping our database structure lean.

Firebase Analytics Events:

- `video_start`: Tracks when a user starts watching a video
- `video_complete`: Tracks video completion
- `video_engagement`: Tracks likes, saves, and shares
- `session_progress`: Tracks learning session progress
- `session_complete`: Tracks session completion with summary data

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

    // Sessions and their subcollections
    match /sessions/{sessionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;

      match /{subcollection}/{document=**} {
        allow read: if request.auth != null && get(/databases/$(database)/documents/sessions/$(sessionId)).data.userId == request.auth.uid;
        allow write: if request.auth != null && get(/databases/$(database)/documents/sessions/$(sessionId)).data.userId == request.auth.uid;
      }
    }

    // Video Reactions
    match /videoReactions/{reactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Saved Videos
    match /savedVideos/{videoId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```
