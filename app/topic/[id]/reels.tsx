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
} from "../../../utils/pexels"
import { LoadingSpinner } from "../../../components/LoadingSpinner"
import { ErrorMessage } from "../../../components/ErrorMessage"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")
const CONTAINER_HEIGHT = SCREEN_HEIGHT

type VideoItem = {
  id: string
  uri: string
  title: string
  description: string
}

export default function ReelsScreen() {
  const { topicId, topicName, duration } = useLocalSearchParams()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const handleSessionEnd = useCallback(() => {
    Alert.alert(
      "Time's Up!",
      "Your learning session is complete. Ready for a quick quiz?",
      [
        {
          text: "Take Quiz",
          onPress: () => {
            // For now, using a placeholder session ID
            router.push({
              pathname: "/quiz/[sessionId]" as const,
              params: { sessionId: "test-session-1" },
            })
          },
        },
      ],
      { cancelable: false }
    )
  }, [])

  useEffect(() => {
    async function loadVideos() {
      try {
        setLoading(true)
        const pexelsVideos = await searchVideos(topicName as string, 10)
        const formattedVideos = pexelsVideos.map((video) => ({
          id: video.id.toString(),
          uri: getBestVideoUrl(video),
          title: `Learn ${topicName} - Part ${video.id}`,
          description: `Educational video about ${topicName}`,
        }))
        setVideos(formattedVideos)
        if (formattedVideos.length > 0) {
          setVisibleVideoId(formattedVideos[0].id)
        }
      } catch (err) {
        console.error("Error loading videos:", err)
        setError("Failed to load videos. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [topicName])

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  }

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setVisibleVideoId(viewableItems[0].item.id)
      }
    },
    []
  )

  const renderItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <View style={styles.videoContainer}>
        <VideoPlayer
          uri={item.uri}
          paused={item.id !== visibleVideoId}
          repeat={true}
          onError={(error) => console.error(`Video ${item.id} error:`, error)}
          onLike={() => console.log("Liked video:", item.id)}
          onDislike={() => console.log("Disliked video:", item.id)}
        />
        <View style={styles.overlay}>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{item.title}</Text>
            <Text style={styles.videoDescription}>{item.description}</Text>
            <View style={styles.topicBadge}>
              <Text style={styles.topicText}>{topicName}</Text>
            </View>
          </View>
        </View>
      </View>
    ),
    [visibleVideoId, topicName]
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <SessionTimer
            durationMinutes={Number(duration) || 5}
            onTimeUp={handleSessionEnd}
          />
        </View>

        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={renderItem}
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
