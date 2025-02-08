import React, { useState, useCallback, useRef, useEffect } from "react"
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  FlatList,
  Text,
  TouchableOpacity,
  ViewToken,
  Alert,
  BackHandler,
} from "react-native"
import { useLocalSearchParams, Stack, router } from "expo-router"
import { LAYOUT } from "../../../constants/layout"
import VideoPlayer from "../../../components/video/VideoPlayer"
import { ChevronLeft } from "lucide-react-native"
import SessionTimer from "../../../components/session/SessionTimer"
import {
  searchVideos,
  getBestVideoUrl,
  PexelsVideo,
  getVideoThumbnail,
} from "../../../utils/pexels"
import { LoadingSpinner } from "../../../components/LoadingSpinner"
import { ErrorMessage } from "../../../components/ErrorMessage"
import {
  getCollection,
  getDocument,
  FIREBASE_COLLECTIONS,
} from "../../../utils/firebase/config"
import { useAuth } from "../../../contexts/auth"
import { SAMPLE_QUESTIONS } from "../../../constants/quiz"
import { Timestamp } from "@react-native-firebase/firestore"
import { useLearningSession } from "../../../hooks/useLearningSession"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")
const CONTAINER_HEIGHT = SCREEN_HEIGHT

type VideoItem = {
  id: string
  uri: string
  title: string
  description: string
  thumbnail: string
}

export default function ReelsScreen() {
  const {
    topicId,
    topicName,
    duration,
    sessionId,
    isResumed,
    lastVideoId,
    lastVideoTimestamp,
  } = useLocalSearchParams()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(
    lastVideoTimestamp ? Number(lastVideoTimestamp) : 0
  )
  const [videosWatched, setVideosWatched] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const initialScrollDone = useRef(false)
  const { user } = useAuth()
  const { pauseSession } = useLearningSession(user?.uid || "")

  // Handle back button and screen exit
  const handleExit = useCallback(async () => {
    const currentSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId
    const timeSpentSeconds = Math.floor((Date.now() - sessionStartTime) / 1000)
    const remainingTimeSeconds = Number(duration) * 60 - timeSpentSeconds

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Leave Session?",
        "Your progress will be saved and you can resume later. Would you like to leave?",
        [
          {
            text: "Stay",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Leave",
            style: "destructive",
            onPress: async () => {
              try {
                // Save session progress before leaving
                await pauseSession(currentSessionId, {
                  lastVideoId: visibleVideoId || undefined,
                  lastVideoTimestamp: currentVideoTime,
                  timeSpentSeconds,
                  videosWatched,
                  remainingTimeSeconds: Math.max(0, remainingTimeSeconds),
                })
                resolve(true)
                router.back()
              } catch (error) {
                console.error("Error saving session progress:", error)
                Alert.alert(
                  "Error",
                  "Failed to save your progress. Please try again."
                )
                resolve(false)
              }
            },
          },
        ],
        { cancelable: false }
      )
    })
  }, [
    sessionId,
    duration,
    visibleVideoId,
    currentVideoTime,
    videosWatched,
    pauseSession,
  ])

  // Track session start time
  const [sessionStartTime] = useState(Date.now())

  // Handle hardware back button (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleExit()
        return true // Prevent default behavior while we handle the exit
      }
    )

    return () => backHandler.remove()
  }, [handleExit])

  // Update the back button to use handleExit
  const renderBackButton = () => (
    <TouchableOpacity style={styles.backButton} onPress={handleExit}>
      <ChevronLeft size={24} color="#fff" />
    </TouchableOpacity>
  )

  // Add video progress tracking
  const handleVideoProgress = useCallback(
    (progress: { currentTime: number }) => {
      setCurrentVideoTime(progress.currentTime)
    },
    []
  )

  const handleVideoEnd = useCallback(() => {
    setVideosWatched((prev) => prev + 1)
  }, [])

  const handleSessionEnd = useCallback(async () => {
    if (!user) return

    // Ensure topicId and sessionId are strings
    const currentTopicId = Array.isArray(topicId) ? topicId[0] : topicId
    const currentSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId
    const currentTopicName = Array.isArray(topicName) ? topicName[0] : topicName

    try {
      // Update session status to completed
      const sessionDoc = getDocument(
        FIREBASE_COLLECTIONS.SESSIONS,
        currentSessionId
      )
      await sessionDoc.update({
        status: "completed",
        completedAt: Timestamp.now(),
      })

      // Create quiz document
      const quizzesCollection = getCollection(FIREBASE_COLLECTIONS.QUIZZES)
      const quizRef = quizzesCollection.doc()

      // Format questions to match our Question type
      const formattedQuestions = SAMPLE_QUESTIONS.map((question) => ({
        question: question.question,
        options: question.options,
        correctAnswer: question.options[question.correctAnswer], // Convert index to actual answer
        explanation: "This answer was chosen based on the video content", // Placeholder explanation
        topicId: currentTopicId,
        videoReference: videos[0]?.id || "", // Reference first video if available
      }))

      const quizData = {
        id: quizRef.id,
        sessionId: currentSessionId,
        userId: user.uid,
        questions: formattedQuestions,
        userResponses: [],
        metadata: {
          generatedAt: Timestamp.now(),
          difficulty: "beginner", // TODO: Make this dynamic based on user's level
          topics: [currentTopicId],
        },
      }

      await quizRef.set(quizData)

      Alert.alert(
        "Time's Up!",
        "Your learning session is complete. Ready for a quick quiz?",
        [
          {
            text: "Take Quiz",
            onPress: () => {
              router.replace({
                pathname: "/quiz/[sessionId]" as const,
                params: {
                  sessionId: currentSessionId,
                  quizId: quizRef.id,
                },
              })
            },
          },
        ],
        { cancelable: false }
      )
    } catch (err) {
      console.error("Error ending session:", err)
      Alert.alert(
        "Error",
        "There was an error ending your session. Please try again."
      )
    }
  }, [topicId, sessionId, topicName, duration, videos.length, user])

  useEffect(() => {
    async function loadVideos() {
      try {
        setLoading(true)
        const pexelsVideos = await searchVideos(topicName as string, 10)
        const formattedVideos = await Promise.all(
          pexelsVideos.map(async (video) => {
            const thumbnail = video.image || (await getVideoThumbnail(video.id))
            return {
              id: video.id.toString(),
              uri: getBestVideoUrl(video),
              title: `Learn ${topicName} - Part ${video.id}`,
              description: `Educational video about ${topicName}`,
              thumbnail,
            }
          })
        )
        setVideos(formattedVideos)

        // Set initial visible video
        if (formattedVideos.length > 0) {
          if (isResumed === "true" && lastVideoId) {
            const resumeVideoId = Array.isArray(lastVideoId)
              ? lastVideoId[0]
              : lastVideoId
            setVisibleVideoId(resumeVideoId)
            // Find the index of the last watched video
            const lastVideoIndex = formattedVideos.findIndex(
              (v) => v.id === resumeVideoId
            )
            if (
              lastVideoIndex !== -1 &&
              flatListRef.current &&
              !initialScrollDone.current
            ) {
              // Scroll to the last watched video
              flatListRef.current.scrollToIndex({
                index: lastVideoIndex,
                animated: false,
              })
              initialScrollDone.current = true
            }
          } else {
            setVisibleVideoId(formattedVideos[0].id)
          }
        }
      } catch (err) {
        console.error("Error loading videos:", err)
        setError("Failed to load videos. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [topicName, isResumed, lastVideoId])

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  }

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const newVisibleVideo = viewableItems[0].item
        setVisibleVideoId(newVisibleVideo.id)
      }
    },
    [topicId, topicName, sessionId]
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        {renderBackButton()}

        <View style={styles.timerContainer}>
          <SessionTimer
            durationMinutes={Number(duration) || 5}
            onTimeUp={handleSessionEnd}
          />
        </View>

        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={({ item }) => (
            <View style={styles.videoContainer}>
              <VideoPlayer
                uri={item.uri}
                paused={item.id !== visibleVideoId}
                repeat={true}
                onError={(error) =>
                  console.error(`Video ${item.id} error:`, error)
                }
                onLike={() => console.log("Liked video:", item.id)}
                onDislike={() => console.log("Disliked video:", item.id)}
                onProgress={handleVideoProgress}
                onEnd={handleVideoEnd}
                videoInfo={{
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  thumbnail: item.thumbnail,
                  duration: "3:00", // Placeholder duration
                  topicId: Array.isArray(topicId) ? topicId[0] : topicId,
                  topicName: Array.isArray(topicName)
                    ? topicName[0]
                    : topicName,
                }}
              />
              <View style={styles.overlay}>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle}>{item.title}</Text>
                  <Text style={styles.videoDescription}>
                    {item.description}
                  </Text>
                  <View style={styles.topicBadge}>
                    <Text style={styles.topicText}>{topicName}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={3}
          removeClippedSubviews={Platform.OS === "android"}
          getItemLayout={(_, index) => ({
            length: CONTAINER_HEIGHT,
            offset: CONTAINER_HEIGHT * index,
            index,
          })}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  videoContainer: {
    height: CONTAINER_HEIGHT,
    position: "relative",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 80,
  },
  videoInfo: {
    flex: 1,
    marginRight: 80,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  videoDescription: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.9,
  },
  topicBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  topicText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 16,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  timerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    right: 20,
    zIndex: 10,
  },
})
