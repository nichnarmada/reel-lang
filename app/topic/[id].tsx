import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Dimensions,
} from "react-native"
import { useLocalSearchParams, Stack, router } from "expo-router"
import { useTopics } from "../../contexts/topics"
import { Topic } from "../../types/topic"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import {
  ChevronLeft,
  Play,
  Clock,
  Users,
  BookOpen,
  X,
} from "lucide-react-native"

const WINDOW_WIDTH = Dimensions.get("window").width

type SessionDuration = 5 | 10 | 15

export default function TopicDetailsScreen() {
  const { id } = useLocalSearchParams()
  const { topics } = useTopics()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDurationModal, setShowDurationModal] = useState(false)

  // Sample subtopics (we'll make this dynamic later)
  const subtopics = [
    "Basic Concepts",
    "Practical Applications",
    "Advanced Theory",
    "History & Evolution",
    "Modern Developments",
  ]

  // Sample video previews (we'll fetch these from Firestore later)
  const videoPreviews = [
    {
      id: "1",
      title: "Introduction to the Basics",
      duration: "3:45",
      difficulty: "beginner",
      thumbnail: "https://picsum.photos/300/200",
    },
    {
      id: "2",
      title: "Intermediate Concepts",
      duration: "4:20",
      difficulty: "intermediate",
      thumbnail: "https://picsum.photos/300/200",
    },
    {
      id: "3",
      title: "Advanced Applications",
      duration: "5:15",
      difficulty: "advanced",
      thumbnail: "https://picsum.photos/300/200",
    },
  ]

  useEffect(() => {
    const loadTopic = async () => {
      try {
        const foundTopic = topics.find((t) => t.id === id)
        if (!foundTopic) {
          throw new Error("Topic not found")
        }
        setTopic(foundTopic)
      } catch (err) {
        console.error("Error loading topic:", err)
        setError(err instanceof Error ? err.message : "Failed to load topic")
      } finally {
        setLoading(false)
      }
    }

    loadTopic()
  }, [id, topics])

  const handleStartLearning = (duration: SessionDuration) => {
    if (!topic) return

    // TODO: Create session in Firestore
    setShowDurationModal(false)
    router.push({
      pathname: "/topic/[id]/reels" as const,
      params: {
        id: topic.id,
        topicId: topic.id,
        topicName: topic.name,
        duration: duration.toString(),
      },
    })
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading topic...</Text>
      </View>
    )
  }

  if (error || !topic) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error || "Topic not found"} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
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
      <ScrollView style={styles.container} stickyHeaderIndices={[0]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{topic.name}</Text>
        </View>

        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.description}>{topic.description}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Users size={16} color="#666" />
              <Text style={styles.statText}>1.2k learners</Text>
            </View>
            <View style={styles.stat}>
              <Clock size={16} color="#666" />
              <Text style={styles.statText}>~10 mins/session</Text>
            </View>
          </View>
        </View>

        {/* Difficulty Levels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Difficulty Levels</Text>
          <View style={styles.difficultyContainer}>
            {topic.availableDifficulties.map((difficulty) => (
              <View
                key={difficulty}
                style={[styles.difficultyBadge, styles.activeDifficulty]}
              >
                <Text style={styles.difficultyText}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Video Previews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview Videos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.videoPreviewsContainer}
          >
            {videoPreviews.map((video) => (
              <View key={video.id} style={styles.videoPreview}>
                <Image
                  source={{ uri: video.thumbnail }}
                  style={styles.videoThumbnail}
                />
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <View style={styles.videoMeta}>
                    <Text style={styles.videoDuration}>{video.duration}</Text>
                    <Text style={styles.videoDifficulty}>
                      {video.difficulty}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Deep Dive Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Deeper</Text>
          <View style={styles.subtopicsContainer}>
            {subtopics.map((subtopic) => (
              <TouchableOpacity
                key={subtopic}
                style={styles.subtopicButton}
                onPress={() => {
                  // TODO: Filter videos by subtopic
                }}
              >
                <BookOpen size={16} color="#666" />
                <Text style={styles.subtopicText}>{subtopic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Learning Button */}
        <View style={styles.startLearningContainer}>
          <TouchableOpacity
            style={styles.startLearningButton}
            onPress={() => setShowDurationModal(true)}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.startLearningText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Duration Selection Modal */}
      <Modal
        visible={showDurationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDurationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Session Duration</Text>
              <TouchableOpacity
                onPress={() => setShowDurationModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              How long would you like to learn for?
            </Text>
            {[5, 10, 15].map((duration) => (
              <TouchableOpacity
                key={duration}
                style={styles.durationOption}
                onPress={() => handleStartLearning(duration as SessionDuration)}
              >
                <Clock size={20} color="#666" />
                <Text style={styles.durationText}>{duration} minutes</Text>
                <Text style={styles.durationSubtext}>
                  ~{Math.ceil(duration / 3)} videos
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingTop: Platform.OS === "ios" ? 60 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 8,
    color: "#000",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 16,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#666",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  activeDifficulty: {
    backgroundColor: "#8a2be215",
  },
  difficultyText: {
    color: "#8a2be2",
    fontSize: 14,
    fontWeight: "500",
  },
  videoPreviewsContainer: {
    gap: 12,
    paddingRight: 16,
  },
  videoPreview: {
    width: WINDOW_WIDTH * 0.7,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  videoThumbnail: {
    width: "100%",
    height: 120,
    backgroundColor: "#f0f0f0",
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#000",
  },
  videoMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  videoDuration: {
    fontSize: 12,
    color: "#666",
  },
  videoDifficulty: {
    fontSize: 12,
    color: "#8a2be2",
  },
  subtopicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subtopicButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  subtopicText: {
    fontSize: 14,
    color: "#333",
  },
  startLearningContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  startLearningButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8a2be2",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startLearningText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  durationOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginLeft: 12,
    flex: 1,
  },
  durationSubtext: {
    fontSize: 14,
    color: "#666",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
