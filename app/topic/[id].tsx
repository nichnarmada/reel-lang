import React, { useEffect, useState, useRef } from "react"
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
  Animated,
} from "react-native"
import { useLocalSearchParams, Stack, router } from "expo-router"
import { GeneratedTopic, RelatedTopic } from "../../types/topic"
import { UserGeneratedTopic } from "../../types/user"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import {
  ChevronLeft,
  Play,
  Clock,
  Users,
  BookOpen,
  X,
  Sparkles,
  Star,
} from "lucide-react-native"
import { useAuth } from "../../contexts/auth"
import {
  getCollection,
  FIREBASE_COLLECTIONS,
  firestore,
} from "../../utils/firebase/config"
import {
  Timestamp,
  doc,
  updateDoc,
  setDoc,
} from "@react-native-firebase/firestore"
import { DifficultyLevel } from "../../types"
import { SessionDuration } from "@/types/session"
import { capitalizeText } from "../../utils/utils"
import { colorManager } from "../../constants/categoryColors"
import { generateSingleTopic } from "../../services/topics/singleTopicGenerator"
import { useSavedTopics } from "../../hooks/useSavedTopics"
const WINDOW_WIDTH = Dimensions.get("window").width

interface TopicDetailsParams {
  id: string
  isGenerated?: string
  category?: string
  name?: string
}

type DisplayTopic = GeneratedTopic & { id: string }

export default function TopicDetailsScreen() {
  const params = useLocalSearchParams()
  const { user } = useAuth()
  const [topic, setTopic] = useState<DisplayTopic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDurationModal, setShowDurationModal] = useState(false)
  const [generatingTopic, setGeneratingTopic] = useState<string | null>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const starScale = useRef(new Animated.Value(1)).current
  const topicColors = useRef<
    Record<string, { background: string; text: string }>
  >({}).current

  const { favoriteTopic, unfavoriteTopic, isTopicFavorited } = useSavedTopics()

  const isGenerated = params.isGenerated === "true"

  // Sample subtopics (we'll make this dynamic later)
  const subtopics = [
    "Basic Concepts",
    "Practical Applications",
    "Advanced Theory",
    "History & Evolution",
    "Modern Developments",
  ]

  useEffect(() => {
    const loadTopic = async () => {
      try {
        if (isGenerated) {
          // For generated topics, create topic object from navigation params
          const name = String(params.name)
          const category = String(params.category)
          const id = String(params.id)

          if (!name || !category) {
            throw new Error("Missing topic information")
          }

          // Create a topic object directly from navigation params
          const generatedTopic: DisplayTopic = {
            id,
            name,
            category,
            description: String(params.description || "Loading description..."),
            emoji: String(params.emoji || "🎯"),
            reasonForSuggestion: String(
              params.reasonForSuggestion || "AI-generated topic"
            ),
            confidence: Number(params.confidence || 1),
            searchTerms: Array.isArray(params.searchTerms)
              ? params.searchTerms
              : [],
            relatedTopics: params.relatedTopics
              ? JSON.parse(String(params.relatedTopics))
              : [],
            availableDifficulties: ["beginner", "intermediate", "advanced"],
            createdAt: Timestamp.now(),
            lastAccessed: Timestamp.now(),
          }

          setTopic(generatedTopic)

          // Save or update the topic in user's generatedTopics subcollection
          if (user) {
            const topicRef = doc(
              firestore,
              FIREBASE_COLLECTIONS.USERS,
              user.uid,
              "generatedTopics",
              id
            )

            const userGeneratedTopic: UserGeneratedTopic = {
              ...generatedTopic,
              userId: user.uid,
            }

            await setDoc(topicRef, userGeneratedTopic)
          }
        } else {
          // Handle fixed topics (existing logic)
          setError("Fixed topics are no longer supported")
        }
      } catch (err) {
        console.error("Error loading topic:", err)
        setError(err instanceof Error ? err.message : "Failed to load topic")
      } finally {
        setLoading(false)
      }
    }

    loadTopic()
  }, [
    params.id,
    params.name,
    params.category,
    params.description,
    params.emoji,
    params.reasonForSuggestion,
    params.searchTerms,
    params.relatedTopics,
    isGenerated,
    user,
  ])

  useEffect(() => {
    if (generatingTopic) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [generatingTopic])

  const handleStartLearning = async (duration: SessionDuration) => {
    if (!topic || !user) return

    try {
      // Create a new session document
      const sessionsCollection = getCollection(FIREBASE_COLLECTIONS.SESSIONS)
      const sessionRef = sessionsCollection.doc()
      await sessionRef.set({
        id: sessionRef.id,
        userId: user.uid,
        topicId: topic.id,
        topicName: topic.name,
        status: "active",
        startTime: Timestamp.now(),
        duration: duration,
        isGeneratedTopic: isGenerated,
      })

      // Navigate to reels with session ID
      setShowDurationModal(false)
      router.push({
        pathname: "/topic/[id]/reels" as const,
        params: {
          id: topic.id,
          topicId: topic.id,
          topicName: topic.name,
          duration: duration.toString(),
          sessionId: sessionRef.id,
        },
      })
    } catch (err) {
      console.error("Error creating session:", err)
      // Still navigate even if session creation fails
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
  }

  const handleDifficultySelect = async (difficulty: DifficultyLevel) => {
    if (!topic || !user || !isGenerated) return

    try {
      const topicRef = doc(
        firestore,
        FIREBASE_COLLECTIONS.USERS,
        user.uid,
        "generatedTopics",
        topic.id
      )

      await updateDoc(topicRef, {
        selectedDifficulty: difficulty,
        lastAccessed: Timestamp.now(),
      })
    } catch (err) {
      console.error("Error updating difficulty:", err)
      // Show error to user
    }
  }

  const handleRelatedTopicPress = async (relatedTopic: RelatedTopic) => {
    if (!topic) return

    try {
      // Generate full topic details
      const generatedTopic = await generateSingleTopic(
        relatedTopic.name,
        topic.category,
        relatedTopic.emoji
      )

      if (!generatedTopic) {
        throw new Error("Failed to generate topic details")
      }

      // Generate a consistent ID
      const topicId = `${topic.category}-${relatedTopic.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`

      // Navigate to topic details
      router.push({
        pathname: "/topic/[id]",
        params: {
          id: topicId,
          isGenerated: "true",
          category: topic.category,
          name: relatedTopic.name,
          description: generatedTopic.description,
          emoji: relatedTopic.emoji,
          reasonForSuggestion: generatedTopic.reasonForSuggestion,
          confidence: generatedTopic.confidence.toString(),
          searchTerms: JSON.stringify(generatedTopic.searchTerms),
          relatedTopics: JSON.stringify(generatedTopic.relatedTopics),
        },
      })
    } catch (error) {
      console.error("Error navigating to related topic:", error)
      // TODO: Show error to user
    }
  }

  const handleFavoritePress = async () => {
    if (!topic) return

    try {
      // Animate the star
      Animated.sequence([
        Animated.spring(starScale, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        Animated.spring(starScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start()

      const topicId = `${topic.category}-${topic.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`

      if (isTopicFavorited(topicId)) {
        await unfavoriteTopic(topicId)
      } else {
        await favoriteTopic(topic)
      }
    } catch (err) {
      console.error("Error toggling favorite:", err)
      // You might want to show an error toast here
    }
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
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} stickyHeaderIndices={[0]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ChevronLeft size={24} color="#000" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                {"emoji" in topic && topic.emoji && (
                  <Text style={styles.headerEmoji}>{topic.emoji}</Text>
                )}
                <Text style={styles.headerTitle}>{topic.name}</Text>
              </View>
              {topic && (
                <Animated.View
                  style={[
                    styles.favoriteButton,
                    { transform: [{ scale: starScale }] },
                  ]}
                >
                  <TouchableOpacity onPress={handleFavoritePress}>
                    <Star
                      size={24}
                      color="#8a2be2"
                      fill={
                        isTopicFavorited(
                          `${topic.category}-${topic.name
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`
                        )
                          ? "#8a2be2"
                          : "transparent"
                      }
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </View>

          {/* Overview Section */}
          <View style={styles.section}>
            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {capitalizeText(topic.category)}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>{topic.description}</Text>

            {/* AI Insight Card */}
            <View style={styles.aiInsightCard}>
              <View style={styles.aiInsightHeader}>
                <Sparkles size={20} color="#8a2be2" />
                <Text style={styles.aiInsightTitle}>
                  Why This Topic is Great for You
                </Text>
              </View>
              <Text style={styles.aiReason}>{topic.reasonForSuggestion}</Text>
            </View>

            {/* Difficulty Selection */}
            {/* <View style={styles.difficultySection}>
              <Text style={styles.sectionSubtitle}>Select Difficulty</Text>
              <View style={styles.difficultyContainer}>
                {topic.availableDifficulties.map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.difficultyBadge,
                      topic.selectedDifficulty === difficulty &&
                        styles.selectedDifficulty,
                    ]}
                    onPress={() => handleDifficultySelect(difficulty)}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        topic.selectedDifficulty === difficulty &&
                          styles.selectedDifficultyText,
                      ]}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View> */}
          </View>

          {/* Deep Dive Topics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Topics</Text>
            <View style={styles.relatedTopicsContainer}>
              {topic.relatedTopics.map((relatedTopic) => {
                // Memoize colors for each topic
                if (!topicColors[relatedTopic.name]) {
                  topicColors[relatedTopic.name] = colorManager.getNextColor()
                }
                const colors = topicColors[relatedTopic.name]
                const isGenerating = generatingTopic === relatedTopic.name

                return (
                  <TouchableOpacity
                    key={relatedTopic.name}
                    disabled={isGenerating}
                    style={[
                      styles.relatedTopicButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={async () => {
                      setGeneratingTopic(relatedTopic.name)
                      try {
                        await handleRelatedTopicPress(relatedTopic)
                      } finally {
                        setGeneratingTopic(null)
                      }
                    }}
                  >
                    <Animated.View
                      style={[
                        styles.relatedTopicContent,
                        isGenerating && {
                          opacity: pulseAnim,
                        },
                      ]}
                    >
                      <Text style={styles.relatedTopicEmoji}>
                        {relatedTopic.emoji}
                      </Text>
                      <Text
                        style={[
                          styles.relatedTopicText,
                          { color: colors.text },
                        ]}
                      >
                        {capitalizeText(relatedTopic.name)}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </ScrollView>

        {/* Floating Start Learning Button */}
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.startLearningButton}
            onPress={() => setShowDurationModal(true)}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.startLearningText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            {[1, 5, 10, 15].map((duration) => (
              <TouchableOpacity
                key={duration}
                style={styles.durationOption}
                onPress={() => handleStartLearning(duration as SessionDuration)}
              >
                <Clock size={20} color="#666" />
                <Text style={styles.durationText}>
                  {duration} minute{duration > 1 ? "s" : ""}
                </Text>
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
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 80, // Add padding to account for floating button
  },
  contentContainer: {
    paddingBottom: 24,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 24,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingTop: Platform.OS === "ios" ? 60 : 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: "#fff",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#8a2be215",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryText: {
    color: "#8a2be2",
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 24,
  },
  aiInsightCard: {
    backgroundColor: "#8a2be215",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#8a2be230",
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  aiInsightTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8a2be2",
  },
  aiReason: {
    fontSize: 15,
    color: "#4a4a4a",
    lineHeight: 22,
  },
  difficultySection: {
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedDifficulty: {
    backgroundColor: "#8a2be215",
    borderColor: "#8a2be2",
  },
  difficultyText: {
    fontSize: 14,
    color: "#666",
  },
  selectedDifficultyText: {
    color: "#8a2be2",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
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
  aiGeneratedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8a2be215",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  aiGeneratedText: {
    fontSize: 12,
    color: "#8a2be2",
    marginLeft: 4,
    fontWeight: "500",
  },
  aiInsight: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 8,
    marginBottom: 16,
  },
  contentCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  contentImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  contentPlaceholder: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: "500",
    margin: 12,
    color: "#1a1a1a",
  },
  relatedTopicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  relatedTopicButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  relatedTopicContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  relatedTopicEmoji: {
    fontSize: 16,
  },
  relatedTopicText: {
    fontSize: 14,
    fontWeight: "500",
  },
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
  },
})
