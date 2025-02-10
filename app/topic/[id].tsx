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
  PanResponder,
} from "react-native"
import { useLocalSearchParams, Stack, router } from "expo-router"
import { GeneratedTopic, RelatedTopic } from "../../types/topic"
import { UserGeneratedTopic } from "../../types/user"
import { ErrorMessage } from "../../components/ErrorMessage"
import {
  ChevronLeft,
  Play,
  Clock,
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
import { theme } from "../../constants/theme"
import { LoadingOverlay } from "../../components/LoadingOverlay"

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
  const [modalVisible, setModalVisible] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Loading topic...")
  const pulseAnim = useRef(new Animated.Value(1)).current
  const starScale = useRef(new Animated.Value(1)).current
  const topicColors = useRef<
    Record<string, { background: string; text: string }>
  >({}).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(100)).current
  const dragY = useRef(new Animated.Value(0)).current

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

  const [relatedTopicLoading, setRelatedTopicLoading] = useState(false)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward drag
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleCloseModal()
        } else {
          // Otherwise, snap back to original position
          Animated.spring(dragY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  const handleCloseModal = () => {
    setShowDurationModal(false)
  }

  useEffect(() => {
    if (showDurationModal) {
      setModalVisible(true)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 100,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false)
        dragY.setValue(0)
      })
    }
  }, [showDurationModal])

  useEffect(() => {
    const loadTopic = async () => {
      try {
        setLoading(true)
        setLoadingMessage("Loading topic...")
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
            const topicRef = getUserSubcollectionDoc(
              user.uid,
              FIREBASE_SUBCOLLECTIONS.USER.GENERATED_TOPICS,
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
    if (loading) {
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
  }, [loading])

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
      router.replace({
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
      router.replace({
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
      setLoading(true)
      setLoadingMessage(`Loading ${relatedTopic.name}...`)

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

      // Navigate to the new topic
      router.replace({
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
    } catch (err) {
      console.error("Error navigating to related topic:", err)
      setError(
        err instanceof Error ? err.message : "Failed to load related topic"
      )
    } finally {
      setLoading(false)
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

  if (error && !loading) {
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

  // Add null check for topic
  if (!topic && !loading) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message="Topic not found" />
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
                {topic?.emoji && (
                  <Text style={styles.headerEmoji}>{topic.emoji}</Text>
                )}
                <Text style={styles.headerTitle}>{topic?.name}</Text>
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

          {/* Only render content if topic exists */}
          {topic && (
            <>
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
                  <Text style={styles.aiReason}>
                    {topic.reasonForSuggestion}
                  </Text>
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
                      topicColors[relatedTopic.name] =
                        colorManager.getNextColor()
                    }
                    const colors = topicColors[relatedTopic.name]

                    return (
                      <TouchableOpacity
                        key={relatedTopic.name}
                        style={[
                          styles.relatedTopicButton,
                          { backgroundColor: colors.background },
                        ]}
                        onPress={async () => {
                          try {
                            await handleRelatedTopicPress(relatedTopic)
                          } catch (err) {
                            console.error(
                              "Error navigating to related topic:",
                              err
                            )
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Failed to load related topic"
                            )
                          }
                        }}
                      >
                        <Animated.View style={[styles.relatedTopicContent]}>
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
            </>
          )}
        </ScrollView>

        {/* Floating Start Learning Button */}
        {topic && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={styles.startLearningButton}
              onPress={() => setShowDurationModal(true)}
            >
              <Play size={20} color="#fff" />
              <Text style={styles.startLearningText}>Start Learning</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Single loading overlay for all loading states */}
        {loading && (
          <LoadingOverlay
            variant="overlay"
            message={loadingMessage}
            style={styles.loadingOverlay}
          />
        )}
      </View>

      {/* Duration Selection Modal */}
      {topic && (
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={handleCloseModal}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={handleCloseModal}
            />
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [
                    {
                      translateY: Animated.add(
                        slideAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: [0, 800],
                        }),
                        dragY
                      ),
                    },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Session Duration</Text>
              </View>

              <Text style={styles.modalSubtitle}>
                How long would you like to learn for?
              </Text>

              {[1, 5, 10, 15].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={styles.durationOption}
                  onPress={() =>
                    handleStartLearning(duration as SessionDuration)
                  }
                >
                  <Clock size={20} color={theme.colors.text.secondary} />
                  <Text style={styles.durationText}>
                    {duration} minute{duration > 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.durationSubtext}>
                    ~{Math.ceil(duration / 3)} videos
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingBottom: theme.spacing.xxl, // For floating button
  },
  contentContainer: {
    paddingBottom: theme.spacing.lg,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.medium,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    paddingTop: Platform.OS === "ios" ? 60 : theme.spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerEmoji: {
    fontSize: theme.typography.sizes.xxl,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  section: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  categoryText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  description: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  aiInsightCard: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  aiInsightTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  aiReason: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
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
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  startLearningText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : theme.spacing.xl,
  },
  dragHandleContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border.dark,
    borderRadius: theme.borderRadius.full,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  durationOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  durationText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  durationSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  backButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
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
    gap: theme.spacing.sm,
  },
  relatedTopicButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  relatedTopicContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  relatedTopicEmoji: {
    fontSize: theme.typography.sizes.md,
  },
  relatedTopicText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  favoriteButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  loadingOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
})
