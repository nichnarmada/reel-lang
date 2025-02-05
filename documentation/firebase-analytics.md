# Firebase Analytics Implementation

## Overview

We use Firebase Analytics to track user engagement, learning patterns, and video interactions without bloating our Firestore database. This provides better performance and built-in analytics capabilities while keeping our database structure lean.

## Event Categories

### Session Events

1. `session_complete`

   - Triggered when a learning session ends
   - Parameters:
     ```typescript
     {
       session_id: string
       topic_id: string
       topic_name: string
       duration: number // in minutes
       videos_watched: number
     }
     ```

2. `session_progress`

   - Triggered at intervals during a session
   - Parameters:
     ```typescript
     {
       session_id: string
       topic_id: string
       progress_percentage: number
       current_video_id: string
     }
     ```

3. `session_pause`

   - Triggered when user pauses a session
   - Parameters:
     ```typescript
     {
       session_id: string;
       topic_id: string;
       elapsed_time: number;
       remaining_time: number;
       reason?: string;
     }
     ```

4. `session_resume`
   - Triggered when user resumes a session
   - Parameters:
     ```typescript
     {
       session_id: string
       topic_id: string
       pause_duration: number
     }
     ```

### Video Engagement Events

1. `video_start`

   - Triggered when a user starts watching a video
   - Parameters:
     ```typescript
     {
       video_id: string
       topic_id: string
       topic_name: string
       session_id: string
     }
     ```

2. `video_complete`

   - Triggered when a video is finished
   - Parameters:
     ```typescript
     {
       video_id: string
       topic_id: string
       topic_name: string
       duration: string
     }
     ```

3. `video_engagement`
   - Triggered for various video interactions
   - Parameters:
     ```typescript
     {
       video_id: string
       action: "like" | "dislike" | "save" | "unsave" | "share"
       topic_id: string
       topic_name: string
     }
     ```

### Learning Assessment Events

1. `quiz_complete`

   - Triggered when a quiz is completed
   - Parameters:
     ```typescript
     {
       session_id: string
       score: number
       total_questions: number
       percentage: number
       difficulty: string
       time_spent: number
     }
     ```

2. `quiz_question_response`
   - Triggered for each question answered
   - Parameters:
     ```typescript
     {
       quiz_id: string
       question_id: string
       is_correct: boolean
       time_spent: number
       topic_id: string
     }
     ```

### Topic Discovery Events

1. `topic_search`

   - Triggered when user searches for topics
   - Parameters:
     ```typescript
     {
       search_query: string;
       results_count: number;
       selected_topic?: string;
     }
     ```

2. `topic_suggestion_interaction`
   - Triggered when user interacts with suggested topics
   - Parameters:
     ```typescript
     {
       suggested_topic_id: string
       action: "view" | "select" | "dismiss"
       source: "search" | "completion" | "related"
     }
     ```

### User Preference Events

1. `difficulty_change`

   - Triggered when user changes difficulty preference
   - Parameters:
     ```typescript
     {
       topic_id?: string;
       old_level: string;
       new_level: string;
       trigger: "user" | "automatic";
     }
     ```

2. `interest_update`
   - Triggered when user updates topics of interest
   - Parameters:
     ```typescript
     {
       added_topics: string[];
       removed_topics: string[];
       total_interests: number;
     }
     ```

### Achievement Events

1. `achievement_unlocked`
   - Triggered when user earns an achievement
   - Parameters:
     ```typescript
     {
       achievement_id: string
       achievement_type: string
       trigger_action: string
       total_achievements: number
     }
     ```

### Performance Events

1. `learning_milestone`

   - Triggered when user reaches learning milestones
   - Parameters:
     ```typescript
     {
       milestone_type: "sessions" | "topics" | "videos" | "quiz_score";
       value: number;
       topic_id?: string;
     }
     ```

2. `knowledge_gap_identified`
   - Triggered when system identifies knowledge gaps
   - Parameters:
     ```typescript
     {
       topic_id: string
       gap_type: string
       confidence_score: number
       identified_through: "quiz" | "video_engagement" | "ai_analysis"
     }
     ```

## Usage Guidelines

1. **Session Tracking**

   - Always include `session_id` when available
   - Track both start and completion of sessions
   - Include relevant metadata (topic, duration)

2. **Video Engagement**

   - Track all user interactions with videos
   - Include context (topic, session) when available
   - Monitor completion rates and engagement patterns

3. **Learning Progress**
   - Track quiz attempts and scores
   - Monitor topic progression
   - Measure learning effectiveness

## Benefits

1. **Performance**

   - Reduced Firestore operations
   - Efficient event batching
   - Automatic data aggregation

2. **Analysis**

   - Built-in Firebase Analytics dashboard
   - Custom event filtering
   - User behavior insights

3. **Cost-Effectiveness**
   - No additional storage costs
   - Included in Firebase free tier
   - Automatic data lifecycle management

## Implementation Examples

```typescript
// Session completion tracking
analytics().logEvent("session_complete", {
  session_id: sessionId,
  topic_id: topicId,
  topic_name: topicName,
  duration: duration,
  videos_watched: videosCount,
})

// Video engagement tracking
analytics().logEvent("video_engagement", {
  video_id: videoId,
  action: "like",
  topic_id: topicId,
  topic_name: topicName,
})

// Quiz completion tracking
analytics().logEvent("quiz_complete", {
  session_id: sessionId,
  score: score,
  total_questions: totalQuestions,
  percentage: percentage,
})

// Topic discovery tracking
analytics().logEvent("topic_search", {
  search_query: query,
  results_count: results.length,
  selected_topic: selectedTopicId,
})

// Achievement tracking
analytics().logEvent("achievement_unlocked", {
  achievement_id: achievementId,
  achievement_type: type,
  trigger_action: action,
  total_achievements: totalCount,
})

// Knowledge gap tracking
analytics().logEvent("knowledge_gap_identified", {
  topic_id: topicId,
  gap_type: gapType,
  confidence_score: score,
  identified_through: source,
})
```
