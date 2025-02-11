import { Stack, useLocalSearchParams, router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import React, { useState, useCallback, useRef, useEffect } from "react"
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  FlatList,
  ViewToken,
  Text,
  TouchableOpacity,
} from "react-native"

import VideoPlayer from "../../components/video/VideoPlayer"
import { useSavedVideos } from "../../hooks/useSavedVideos"
import { SavedVideo } from "../../types/user"
import { getVideoDetails, getBestVideoUrl } from "../../utils/pexels"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")
const CONTAINER_HEIGHT = SCREEN_HEIGHT

export default function SavedVideoPlayerScreen() {
  const { id } = useLocalSearchParams()
  const { videos } = useSavedVideos()
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  const flatListRef = useRef<FlatList>(null)

  // Find the initial index of the video to play
  const initialIndex = videos.findIndex((v) => v.id === id)

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

  // Fetch video URL when a video becomes visible
  useEffect(() => {
    if (!visibleVideoId) return

    const currentVideo = videos.find((v) => v.id === visibleVideoId)
    if (!currentVideo || videoUrls[currentVideo.videoId]) return

    getVideoDetails(currentVideo.videoId)
      .then((videoDetails) => {
        const url = getBestVideoUrl(videoDetails)
        setVideoUrls((prev) => ({ ...prev, [currentVideo.videoId]: url }))
      })
      .catch((error) => {
        console.error("Error getting video URL:", error)
      })
  }, [visibleVideoId, videos, videoUrls])

  const renderVideo = useCallback(
    ({ item }: { item: SavedVideo }) => (
      <View style={styles.videoContainer}>
        {videoUrls[item.videoId] ? (
          <>
            <VideoPlayer
              uri={videoUrls[item.videoId]}
              paused={item.id !== visibleVideoId}
              repeat
              onError={(error) =>
                console.error(`Video ${item.id} error:`, error)
              }
              videoInfo={{
                id: item.videoId,
                title: item.title,
                description: item.description,
                thumbnail: item.thumbnail,
                duration: item.duration,
                topicId: item.topicId,
                topicName: item.topicName,
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{item.title}</Text>
                <Text style={styles.videoDescription}>{item.description}</Text>
                <View style={styles.topicBadge}>
                  <Text style={styles.topicText}>{item.topicName}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </View>
    ),
    [visibleVideoId, videoUrls]
  )

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

        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={renderVideo}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: CONTAINER_HEIGHT,
            offset: CONTAINER_HEIGHT * index,
            index,
          })}
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
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
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
})
