import React, { useState, useRef, useEffect } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native"
import Video, { VideoRef } from "react-native-video"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
} from "lucide-react-native"
import { LAYOUT } from "../../constants/layout"
import { useSavedVideos } from "../../hooks/useSavedVideos"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")
const CONTAINER_HEIGHT = SCREEN_HEIGHT - LAYOUT.TAB_BAR_HEIGHT

type VideoPlayerProps = {
  uri: string
  paused: boolean
  repeat?: boolean
  onError?: (error: any) => void
  onLoad?: () => void
  onProgress?: (progress: { currentTime: number }) => void
  onEnd?: () => void
  onLike?: () => void
  onDislike?: () => void
  videoInfo?: {
    id: string
    title: string
    description: string
    thumbnail: string
    duration: string
    topicId: string
    topicName: string
  }
  style?: any
}

export default function VideoPlayer({
  uri,
  paused: initialPaused,
  repeat = false,
  onError,
  onLoad,
  onProgress,
  onEnd,
  onLike,
  onDislike,
  videoInfo,
  style,
}: VideoPlayerProps) {
  const videoRef = useRef<VideoRef>(null)
  const [paused, setPaused] = useState(initialPaused)
  const [loading, setLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const { videos, saveVideo, removeVideo } = useSavedVideos()
  const isSaved = videoInfo
    ? videos.some((v) => v.videoId === videoInfo.id)
    : false

  useEffect(() => {
    setPaused(initialPaused)
  }, [initialPaused])

  const handleLoad = (data: any) => {
    setLoading(false)
    setDuration(data.duration)
    onLoad?.()
  }

  const handleError = (error: any) => {
    setLoading(false)
    console.error("Video playback error:", error)
    onError?.(error)
  }

  const handleEnd = () => {
    onEnd?.()
  }

  const handleProgress = (data: { currentTime: number }) => {
    setProgress(data.currentTime / duration)
    onProgress?.(data)
  }

  const togglePlayPause = () => {
    setPaused(!paused)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleLike = () => {
    if (!isDisliked) {
      setIsLiked(!isLiked)
      setIsDisliked(false)
      onLike?.()
    } else {
      setIsDisliked(false)
    }
  }

  const handleDislike = () => {
    if (!isLiked) {
      setIsDisliked(!isDisliked)
      setIsLiked(false)
      onDislike?.()
    } else {
      setIsLiked(false)
    }
  }

  const handleSave = async () => {
    if (!videoInfo) return

    try {
      // Validate required fields using type-safe field access
      const requiredFields = {
        id: videoInfo.id,
        title: videoInfo.title,
        description: videoInfo.description,
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
        topicId: videoInfo.topicId,
        topicName: videoInfo.topicName,
      }

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key)

      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields)
        console.log("Video info:", videoInfo)
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`)
      }

      if (isSaved) {
        const savedVideo = videos.find((v) => v.videoId === videoInfo.id)
        if (savedVideo) {
          await removeVideo(savedVideo.id, videoInfo.id)
        }
      } else {
        await saveVideo({
          id: videoInfo.id,
          title: videoInfo.title,
          description: videoInfo.description,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration,
          topicId: videoInfo.topicId,
          topicName: videoInfo.topicName,
        })
      }
    } catch (err) {
      console.error("Error toggling video save:", err)
    }
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode="cover"
        repeat={repeat}
        paused={paused}
        muted={isMuted}
        onLoad={handleLoad}
        onError={handleError}
        onProgress={handleProgress}
        onEnd={handleEnd}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        {...(Platform.OS === "ios"
          ? { automaticallyWaitsToMinimizeStalling: false }
          : {})}
      />

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Video Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          onPress={handleLike}
          style={[styles.controlButton, isLiked && styles.activeControlButton]}
        >
          <ThumbsUp size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDislike}
          style={[
            styles.controlButton,
            isDisliked && styles.activeControlButton,
          ]}
        >
          <ThumbsDown size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          style={styles.controlButton}
        >
          {paused ? (
            <Play size={24} color="#fff" />
          ) : (
            <Pause size={24} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
          {isMuted ? (
            <VolumeX size={24} color="#fff" />
          ) : (
            <Volume2 size={24} color="#fff" />
          )}
        </TouchableOpacity>

        {videoInfo && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              isSaved && styles.activeControlButton,
            ]}
            onPress={handleSave}
          >
            {isSaved ? (
              <BookmarkCheck size={24} color="#8a2be2" />
            ) : (
              <Bookmark size={24} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  progressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
  },
  controlsContainer: {
    position: "absolute",
    right: 8,
    bottom: 40,
    alignItems: "center",
    gap: 16,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeControlButton: {
    backgroundColor: "rgba(138, 43, 226, 0.7)",
  },
})
