import { Timestamp } from "@react-native-firebase/firestore"
import { useLocalSearchParams, Stack, router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
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

import { ErrorMessage } from "../../../components/ErrorMessage"
import { LoadingOverlay } from "../../../components/LoadingOverlay"
import { LoadingSpinner } from "../../../components/LoadingSpinner"
import SessionTimer from "../../../components/session/SessionTimer"
import VideoPlayer from "../../../components/video/VideoPlayer"
import { useAuth } from "../../../contexts/auth"
import { useLearningSession } from "../../../hooks/useLearningSession"
import { getContentForSession } from "../../../services/content/contentFlow"
import { startQuizAfterSession } from "../../../services/quiz/quizFlow"
import { UserProgress } from "../../../types/quiz"
import { Session } from "../../../types/session"
import {
  getDocument,
  FIREBASE_COLLECTIONS,
} from "../../../utils/firebase/config"
import {
  searchVideos,
  getBestVideoUrl,
  getVideoThumbnail,
} from "../../../utils/pexels"
import { VideoSegmentScript } from "../../../types/content"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")
const CONTAINER_HEIGHT = SCREEN_HEIGHT

type VideoItem = {
  id: string
  uri: string
  title: string
  description: string
  thumbnail: string
  segmentId?: string
}

export default function ReelsScreen() {
  const {
    topicId,
    topicName,
    duration,
    sessionId,
    contentId,
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

  // Add loading state for quiz generation
  const [quizLoading, setQuizLoading] = useState({
    show: false,
    message: "",
    step: 0,
    totalSteps: 3,
  })

  // Add state to track session and quiz status
  const [sessionEnded, setSessionEnded] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)

  // Track session start time
  const [sessionStartTime] = useState(Date.now())

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
                router.dismissTo("/(tabs)" as const)
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
    // Prevent multiple triggers if session already ended or quiz already started
    if (!user || sessionEnded || quizStarted) return

    try {
      setSessionEnded(true) // Mark session as ended

      // Format the topic ID correctly to match how it's stored
      const currentTopicName = Array.isArray(topicName)
        ? topicName[0]
        : topicName
      const currentTopicId = `cooking-${currentTopicName
        .toLowerCase()
        .replace(/\s+/g, "-")}`
      const currentSessionId = Array.isArray(sessionId)
        ? sessionId[0]
        : sessionId

      // Update session status to completed
      const sessionDoc = getDocument(
        FIREBASE_COLLECTIONS.SESSIONS,
        currentSessionId
      )
      await sessionDoc.update({
        status: "completed",
        completedAt: Timestamp.now(),
      })

      // Get the session data
      const sessionSnapshot = await sessionDoc.get()
      if (!sessionSnapshot.exists) {
        throw new Error("Session not found")
      }

      const sessionData = sessionSnapshot.data()
      const session: Session = {
        ...sessionData,
        id: currentSessionId,
        topicId: currentTopicId,
        topicName: currentTopicName,
        userId: user.uid,
        status: "completed",
        startTime: sessionData?.startTime || Timestamp.now(),
        duration: Number(duration),
      }

      const userProgress: UserProgress = {
        videosWatched,
        timeSpentSeconds: Math.floor((Date.now() - sessionStartTime) / 1000),
        completedSegments: [],
      }

      Alert.alert(
        "Time's Up!",
        "Your learning session is complete. Ready for a quick quiz?",
        [
          {
            text: "Take Quiz",
            onPress: async () => {
              // Prevent multiple quiz starts
              if (quizStarted) return
              setQuizStarted(true)

              try {
                // Start loading with first step
                setQuizLoading({
                  show: true,
                  message: "Analyzing your learning session...",
                  step: 1,
                  totalSteps: 3,
                })

                // Simulate a small delay for UX
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Update to second step
                setQuizLoading((prev) => ({
                  ...prev,
                  message: "Generating personalized questions...",
                  step: 2,
                }))

                // Generate the quiz
                const { quizId, quizSessionId } = await startQuizAfterSession(
                  session,
                  userProgress,
                  true // Start immediately when clicking "Take Quiz"
                )

                // Final step before navigation
                setQuizLoading((prev) => ({
                  ...prev,
                  message: "Preparing your quiz experience...",
                  step: 3,
                }))

                // Small delay to show the final step
                await new Promise((resolve) => setTimeout(resolve, 500))

                // Hide loading
                setQuizLoading((prev) => ({ ...prev, show: false }))

                // Navigate to quiz screen
                router.replace({
                  pathname: "/quiz/[sessionId]" as const,
                  params: {
                    sessionId: quizSessionId,
                  },
                })
              } catch (error) {
                setQuizLoading((prev) => ({ ...prev, show: false }))
                setQuizStarted(false) // Reset quiz started state on error
                console.error("Error generating quiz:", error)
                Alert.alert(
                  "Error",
                  "Failed to generate quiz. Please try again."
                )
              }
            },
          },
          {
            text: "Skip",
            style: "cancel",
            onPress: async () => {
              // Navigate back to home immediately
              router.replace("/(tabs)/learning" as const)

              // Generate the quiz in the background
              try {
                const { quizId, quizSessionId } = await startQuizAfterSession(
                  session,
                  userProgress,
                  false // Set as pending when skipping
                )
                console.log("Generated pending quiz:", {
                  quizId,
                  quizSessionId,
                })
              } catch (error) {
                console.error("Error generating skipped quiz:", error)
                // No need to show error to user since they're already on the learning tab
              }
            },
          },
        ],
        { cancelable: false }
      )
    } catch (err) {
      console.error("Error ending session:", err)
      setSessionEnded(false) // Reset session ended state on error
      Alert.alert(
        "Error",
        "There was an error ending your session. Please try again."
      )
    }
  }, [
    topicId,
    sessionId,
    user,
    topicName,
    videosWatched,
    sessionStartTime,
    contentId,
    sessionEnded,
    quizStarted,
  ])

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true)

        let videoScripts: VideoSegmentScript[] = []
        let currentSessionId = ""

        // Load generated content
        if (sessionId) {
          currentSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId
          const content = await getContentForSession(currentSessionId)
          if (content && content.videoScripts) {
            videoScripts = content.videoScripts
          }
        }

        // Continue with your existing video loading logic
        const pexelsVideos = await searchVideos(
          topicName as string,
          videoScripts.length || 10
        )
        const formattedVideos = await Promise.all(
          pexelsVideos.map(async (video, index) => {
            const thumbnail = video.image || (await getVideoThumbnail(video.id))
            return {
              id: video.id.toString(),
              uri: getBestVideoUrl(video),
              title: `Learn ${topicName} - Part ${video.id}`,
              description: `Educational video about ${topicName}`,
              thumbnail,
              segmentId: videoScripts[index]?.id,
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
      } catch (error) {
        console.error("Error loading content:", error)
        setError("Failed to load content")
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [topicName, isResumed, lastVideoId, sessionId])

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
                repeat
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
                segmentId={item.segmentId}
                sessionId={Array.isArray(sessionId) ? sessionId[0] : sessionId}
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

        {quizLoading.show && (
          <LoadingOverlay
            variant="overlay"
            message={`${quizLoading.message} (${quizLoading.step}/${quizLoading.totalSteps})`}
            size="large"
            isTransparent={false}
          />
        )}
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
