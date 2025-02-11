import {
  Play,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
} from "lucide-react-native"
import React, { useState, useRef, useEffect } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated"
import Video, { VideoRef } from "react-native-video"
import { Audio } from "expo-av"

import { LAYOUT } from "../../constants/layout"
import { theme } from "../../constants/theme"
import { useSavedVideos } from "../../hooks/useSavedVideos"
import { AudioGenerationService } from "../../services/audio/audioGenerationService"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")
const CONTAINER_HEIGHT = SCREEN_HEIGHT - LAYOUT.TAB_BAR_HEIGHT

interface VideoPlayerProps {
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
  segmentId?: string
  sessionId?: string
  targetDuration?: number
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
  segmentId,
  sessionId,
  targetDuration,
}: VideoPlayerProps) {
  const videoRef = useRef<VideoRef>(null)
  const audioRef = useRef<VideoRef>(null)
  const [paused, setPaused] = useState(initialPaused)
  const [loading, setLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [videoLoopCount, setVideoLoopCount] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const { videos, saveVideo, removeVideo } = useSavedVideos()
  const isSaved = videoInfo
    ? videos.some((v) => v.videoId === videoInfo.id)
    : false
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  // Load audio URL if segmentId and sessionId are provided
  useEffect(() => {
    let isMounted = true
    let retryTimeout: NodeJS.Timeout

    async function loadAudioUrl() {
      if (!segmentId || !sessionId) return

      try {
        const audioService = AudioGenerationService.getInstance()
        const audioMetadata = await audioService.getAudioMetadata(
          sessionId,
          segmentId
        )

        if (!isMounted) return

        if (audioMetadata && audioMetadata.status === "completed") {
          console.log("Loading audio from URL:", audioMetadata.url)
          setAudioUrl(audioMetadata.url)
        } else if (audioMetadata && audioMetadata.status === "pending") {
          // If audio is still pending, retry after a delay
          console.log("Audio still generating, will retry in 2 seconds...")
          retryTimeout = setTimeout(loadAudioUrl, 2000)
        } else {
          console.warn("Audio not found or not ready:", segmentId)
        }
      } catch (error) {
        console.error("Error loading audio URL:", error)
      }
    }

    loadAudioUrl()

    return () => {
      isMounted = false
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [segmentId, sessionId])

  useEffect(() => {
    setPaused(initialPaused)
  }, [initialPaused])

  const handleLoad = (data: any) => {
    setLoading(false)
    setVideoDuration(data.duration)
    onLoad?.()

    // Calculate how many times to loop the video
    if (targetDuration && data.duration) {
      const loopCount = Math.ceil(targetDuration / data.duration)
      setVideoLoopCount(loopCount)
    }
  }

  const handleAudioLoad = (data: any) => {
    if (data.duration) {
      setAudioDuration(data.duration)
      // If we have audio, use its duration for progress calculation
      setVideoDuration(data.duration)
    }
  }

  const handleError = (error: any) => {
    setLoading(false)
    console.error("Video playback error:", error)
    onError?.(error)
  }

  const handleProgress = (data: { currentTime: number }) => {
    // Only update progress from video if we don't have audio
    if (!audioUrl) {
      setProgress(data.currentTime / videoDuration)
      onProgress?.(data)
    }
  }

  const handleAudioProgress = (data: { currentTime: number }) => {
    // Use audio progress when available
    if (audioUrl && audioDuration) {
      setProgress(data.currentTime / audioDuration)
      onProgress?.(data)

      // Loop video if needed
      if (videoRef.current) {
        const videoTime = data.currentTime % videoDuration
        videoRef.current.seek(videoTime)
      }
    }
  }

  const handleEnd = () => {
    // Only handle end from video if we don't have audio
    if (!audioUrl) {
      if (targetDuration && videoLoopCount > 1) {
        setVideoLoopCount((prev) => prev - 1)
        videoRef.current?.seek(0)
      } else {
        onEnd?.()
      }
    }
  }

  const handleAudioEnd = () => {
    // Handle end from audio when available
    if (audioUrl) {
      onEnd?.()
    }
  }

  const togglePlayPause = () => {
    setPaused(!paused)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const showLikeAnimation = () => {
    "worklet"
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1),
      withTiming(0, { duration: 300 })
    )
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 200 })
    )
  }

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false)
    } else {
      setIsDisliked(false)
      setIsLiked(true)
      showLikeAnimation()
    }
  }

  const handleDislike = () => {
    setIsLiked(false)
    setIsDisliked(!isDisliked)
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

  // Single tap for play/pause
  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onStart(() => {
      "worklet"
      runOnJS(togglePlayPause)()
    })

  // Double tap for like
  const doubleTap = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(2)
    .onStart(() => {
      "worklet"
      if (!isLiked) {
        runOnJS(setIsDisliked)(false)
        runOnJS(setIsLiked)(true)
      }
      showLikeAnimation()
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  })

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={Gesture.Exclusive(doubleTap, singleTap)}>
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri }}
            style={styles.video}
            resizeMode="cover"
            repeat={true}
            paused={paused}
            muted={true}
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
          {audioUrl && (
            <Video
              ref={audioRef}
              source={{ uri: audioUrl }}
              paused={paused}
              muted={isMuted}
              repeat={!!(repeat || (targetDuration && videoLoopCount > 1))}
              style={{ width: 0, height: 0 }}
              playInBackground={false}
              playWhenInactive={false}
              onLoad={handleAudioLoad}
              onProgress={handleAudioProgress}
              onEnd={handleAudioEnd}
            />
          )}
          {paused && !loading && (
            <View style={styles.pauseOverlay}>
              <Play size={64} color={theme.colors.text.inverse} />
            </View>
          )}
          <Animated.View style={[styles.likeAnimation, animatedStyle]}>
            <ThumbsUp size={80} color={theme.colors.text.inverse} />
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={theme.colors.text.inverse} />
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
          <ThumbsUp size={24} color={theme.colors.text.inverse} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDislike}
          style={[
            styles.controlButton,
            isDisliked && styles.activeControlButton,
          ]}
        >
          <ThumbsDown size={24} color={theme.colors.text.inverse} />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
          {isMuted ? (
            <VolumeX size={24} color={theme.colors.text.inverse} />
          ) : (
            <Volume2 size={24} color={theme.colors.text.inverse} />
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
              <BookmarkCheck size={24} color={theme.colors.text.inverse} />
            ) : (
              <Bookmark size={24} color={theme.colors.text.inverse} />
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
  videoWrapper: {
    flex: 1,
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
    backgroundColor: theme.colors.text.inverse,
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
    backgroundColor: `${theme.colors.primary}B3`, // B3 is ~70% opacity in hex
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  likeAnimation: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    transform: [{ translateY: -40 }], // Half the heart icon size
    justifyContent: "center",
    alignItems: "center",
  },
})
