import React, { useEffect, useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
  Alert,
} from "react-native"
import { useLocalSearchParams, Stack, router } from "expo-router"
import { GeneratedTopic, RelatedTopic } from "../../types/topic"
import { UserGeneratedTopic } from "../../types/user"
import { ErrorMessage } from "../../components/ErrorMessage"
import { ChevronLeft, Play, Clock, Sparkles, Star } from "lucide-react-native"
import { useAuth } from "../../contexts/auth"
import {
  FIREBASE_SUBCOLLECTIONS,
  getUserSubcollectionDoc,
} from "../../utils/firebase/config"
import { Timestamp, updateDoc, setDoc } from "@react-native-firebase/firestore"
import { DifficultyLevel } from "../../types"
import { SessionDuration } from "@/types/session"
import { capitalizeText } from "../../utils/utils"
import { colorManager } from "../../constants/categoryColors"
import { generateSingleTopic } from "../../services/topics/singleTopicGenerator"
import { useSavedTopics } from "../../hooks/useSavedTopics"
import { theme } from "../../constants/theme"
import { LoadingOverlay } from "../../components/LoadingOverlay"
import { startContentGeneration } from "../../services/content/contentFlow"
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
} from "react-native-reanimated"
import { Gesture, GestureDetector } from "react-native-gesture-handler"

const WINDOW_WIDTH = Dimensions.get("window").width

interface TopicDetailsParams {
  id: string
  isGenerated?: string
  category?: string
  name?: string
}

type DisplayTopic = GeneratedTopic & { id: string }

interface SessionConfig {
  difficulty: DifficultyLevel
  duration?: SessionDuration
}

export default function TopicDetailsScreen() {
  const params = useLocalSearchParams()
  const { user } = useAuth()
  const [topic, setTopic] = useState<DisplayTopic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDurationModal, setShowDurationModal] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Loading topic...")
  const [sessionLoading, setSessionLoading] = useState({
    show: false,
    message: "",
    step: 0,
    totalSteps: 3,
  })
  const pulseAnim = useSharedValue(1)
  const starScale = useSharedValue(1)
  const topicColors = useRef<
    Record<string, { background: string; text: string }>
  >({}).current
  const fadeAnim = useSharedValue(0)
  const slideAnim = useSharedValue(100)
  const dragY = useSharedValue(0)
  const lineProgress = useSharedValue(0)

  const { favoriteTopic, unfavoriteTopic, isTopicFavorited } = useSavedTopics()

  const isGenerated = params.isGenerated === "true"

  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    difficulty: "beginner",
  })
  const [configStep, setConfigStep] = useState<
    "difficulty" | "duration" | "confirm" | "loading"
  >("difficulty")

  const gesture = Gesture.Pan()
    .onBegin(() => {
      "worklet"
      dragY.value = 0
    })
    .onUpdate((event) => {
      "worklet"
      if (event.translationY > 0) {
        dragY.value = event.translationY
      }
    })
    .onEnd((event) => {
      "worklet"
      if (event.translationY > 100) {
        runOnJS(handleCloseModal)()
      } else {
        dragY.value = withSpring(0)
      }
    })

  const modalStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }))

  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          interpolate(slideAnim.value, [0, 100], [0, 800], "clamp") +
          dragY.value,
      },
    ],
  }))

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }))

  const handleCloseModal = () => {
    setShowDurationModal(false)
  }

  useEffect(() => {
    if (showDurationModal) {
      setModalVisible(true)
      fadeAnim.value = withTiming(1, { duration: 200 })
      slideAnim.value = withSpring(0, {
        damping: 15,
        stiffness: 90,
      })
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 })
      slideAnim.value = withSpring(100, {
        damping: 15,
        stiffness: 90,
      })
      runOnJS(setModalVisible)(false)
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
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1 // infinite
      )
    } else {
      pulseAnim.value = 1
    }
  }, [loading])

  useEffect(() => {
    let toValue = 0
    if (configStep === "duration") toValue = 1
    else if (configStep === "confirm" || configStep === "loading") toValue = 2

    lineProgress.value = withSpring(toValue, {
      damping: 15,
      stiffness: 90,
    })
  }, [configStep])

  const firstLineStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: 0,
    width: `${interpolate(lineProgress.value, [0, 1], [0, 100], "clamp")}%`,
    height: 2,
    backgroundColor: theme.colors.primary,
  }))

  const secondLineStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: 0,
    width: `${interpolate(lineProgress.value, [1, 2], [0, 100], "clamp")}%`,
    height: 2,
    backgroundColor: theme.colors.text.secondary,
  }))

  const handleStartLearning = async (duration: SessionDuration) => {
    if (!topic || !user) return

    try {
      setSessionLoading({
        show: true,
        message: "Preparing your learning session...",
        step: 1,
        totalSteps: 3,
      })

      // Update topic's difficulty
      const topicRef = getUserSubcollectionDoc(
        user.uid,
        FIREBASE_SUBCOLLECTIONS.USER.GENERATED_TOPICS,
        topic.id
      )

      await updateDoc(topicRef, {
        selectedDifficulty: sessionConfig.difficulty,
        lastAccessed: Timestamp.now(),
      })

      // Update to second step
      setSessionLoading((prev) => ({
        ...prev,
        message: "Generating educational content...",
        step: 2,
      }))

      const contentBundle = await startContentGeneration(
        user.uid,
        {
          ...topic,
          selectedDifficulty: sessionConfig.difficulty,
        },
        duration
      )

      if (!contentBundle) {
        throw new Error("Failed to generate content")
      }

      // Update to final step
      setSessionLoading((prev) => ({
        ...prev,
        message: "Preparing video experience...",
        step: 3,
      }))

      // Small delay to show the final step
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Navigate to reels with session ID
      setShowDurationModal(false)
      setSessionLoading((prev) => ({ ...prev, show: false }))
      router.replace({
        pathname: "/topic/[id]/reels" as const,
        params: {
          id: topic.id,
          topicId: topic.id,
          topicName: topic.name,
          duration: duration.toString(),
          sessionId: contentBundle.session.id,
          contentId: contentBundle.content.id,
        },
      })
    } catch (err) {
      console.error("Error in learning flow:", err)
      setSessionLoading((prev) => ({ ...prev, show: false }))
      Alert.alert(
        "Error",
        "Failed to start learning session. Please try again."
      )
    }
  }

  const handleDifficultySelect = async (difficulty: DifficultyLevel) => {
    if (!topic || !user || !isGenerated) return

    try {
      const topicRef = getUserSubcollectionDoc(
        user.uid,
        FIREBASE_SUBCOLLECTIONS.USER.GENERATED_TOPICS,
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
      starScale.value = withSequence(withSpring(1.2), withSpring(1))

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
    }
  }

  const getVideoCount = (duration: number): number => {
    switch (duration) {
      case 1:
        return 2 // Two 30-second videos
      case 5:
        return 3 // Three ~100-second videos
      case 10:
        return 5 // Five ~120-second videos
      case 15:
        return 7 // Seven ~130-second videos
      default:
        return 3
    }
  }

  const renderModalContent = () => {
    const renderDifficultyStep = () => (
      <View style={[styles.modalStep, styles.stepContainer]}>
        <View>
          <Text style={styles.modalTitle}>Choose Your Learning Level</Text>
          <Text style={styles.modalSubtitle}>
            Select the difficulty that best matches your current understanding
          </Text>

          {["beginner", "intermediate", "advanced"].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyOption,
                sessionConfig.difficulty === level && styles.selectedOption,
              ]}
              onPress={() => {
                setSessionConfig((prev) => ({
                  ...prev,
                  difficulty: level as DifficultyLevel,
                }))
                setConfigStep("duration")
              }}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    sessionConfig.difficulty === level &&
                      styles.selectedOptionText,
                  ]}
                >
                  {capitalizeText(level)}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    sessionConfig.difficulty === level &&
                      styles.selectedOptionText,
                  ]}
                >
                  {level === "beginner"
                    ? "Perfect for first-time learners"
                    : level === "intermediate"
                    ? "For those with basic understanding"
                    : "Deep dive into complex concepts"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )

    const renderDurationStep = () => (
      <View style={[styles.modalStep, styles.stepContainer]}>
        <View>
          <Text style={styles.modalTitle}>Choose Session Duration</Text>
          <Text style={styles.modalSubtitle}>
            How long would you like to learn for?
          </Text>

          {[1, 5, 10, 15].map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[styles.configOption]}
              onPress={() => {
                setSessionConfig((prev) => ({
                  ...prev,
                  duration: duration as SessionDuration,
                }))
                setConfigStep("confirm")
              }}
            >
              <View style={styles.optionContent}>
                <View style={styles.durationHeader}>
                  <Clock size={20} color={theme.colors.text.secondary} />
                  <Text style={styles.optionTitle}>
                    {duration} minute{duration > 1 ? "s" : ""}
                  </Text>
                </View>
                <Text style={styles.optionDescription}>
                  {getVideoCount(duration)} focused video
                  {getVideoCount(duration) > 1 ? "s" : ""}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )

    const renderConfirmStep = () => (
      <View style={[styles.modalStep, styles.stepContainer]}>
        {sessionLoading.show ? (
          <View style={styles.loadingStepContent}>
            <LoadingOverlay
              variant="inline"
              message={`${sessionLoading.message} (${sessionLoading.step}/${sessionLoading.totalSteps})`}
              size="large"
            />
          </View>
        ) : (
          <View style={styles.confirmStepContent}>
            <View>
              <Text style={styles.modalTitle}>Confirm Your Choices</Text>
              <Text style={styles.modalSubtitle}>
                Review your learning session settings
              </Text>

              <View style={styles.confirmationCard}>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Difficulty Level</Text>
                  <Text style={styles.confirmationValue}>
                    {capitalizeText(sessionConfig.difficulty)}
                  </Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Session Duration</Text>
                  <Text style={styles.confirmationValue}>
                    {sessionConfig.duration} minutes
                  </Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Number of Videos</Text>
                  <Text style={styles.confirmationValue}>
                    {getVideoCount(sessionConfig.duration || 0)} videos
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                setConfigStep("loading")
                handleStartLearning(sessionConfig.duration as SessionDuration)
              }}
            >
              <Text style={styles.startButtonText}>Start Learning</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )

    return (
      <Animated.View style={[styles.modalContent, modalContentStyle]}>
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <TouchableOpacity
            onPress={() => {
              if (
                configStep === "duration" ||
                configStep === "confirm" ||
                configStep === "loading"
              ) {
                setConfigStep("difficulty")
              }
            }}
            disabled={configStep === "difficulty"}
            style={styles.stepColumn}
          >
            <View
              style={[
                styles.stepDot,
                (configStep === "difficulty" ||
                  configStep === "duration" ||
                  configStep === "confirm" ||
                  configStep === "loading") &&
                  styles.activeStepDot,
                (configStep === "duration" ||
                  configStep === "confirm" ||
                  configStep === "loading") &&
                  styles.completedStepDot,
              ].filter(Boolean)}
            />
            <View style={styles.stepLabelContainer}>
              <Text
                style={[
                  styles.stepLabel,
                  (configStep === "difficulty" ||
                    configStep === "duration" ||
                    configStep === "confirm" ||
                    configStep === "loading") &&
                    styles.activeStepLabel,
                  (configStep === "duration" ||
                    configStep === "confirm" ||
                    configStep === "loading") &&
                    styles.completedStepLabel,
                ].filter(Boolean)}
              >
                Difficulty
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.stepLineContainer}>
            <View style={styles.stepLine} />
            <Animated.View style={firstLineStyle} />
          </View>
          <TouchableOpacity
            onPress={() => {
              if (configStep === "confirm" || configStep === "loading") {
                setConfigStep("duration")
              }
            }}
            disabled={configStep === "difficulty" || configStep === "duration"}
            style={styles.stepColumn}
          >
            <View
              style={[
                styles.stepDot,
                (configStep === "duration" ||
                  configStep === "confirm" ||
                  configStep === "loading") &&
                  styles.activeStepDot,
                (configStep === "confirm" || configStep === "loading") &&
                  styles.completedStepDot,
              ].filter(Boolean)}
            />
            <View style={styles.stepLabelContainer}>
              <Text
                style={[
                  styles.stepLabel,
                  (configStep === "duration" ||
                    configStep === "confirm" ||
                    configStep === "loading") &&
                    styles.activeStepLabel,
                  (configStep === "confirm" || configStep === "loading") &&
                    styles.completedStepLabel,
                ].filter(Boolean)}
              >
                Duration
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.stepLineContainer}>
            <View style={styles.stepLine} />
            <Animated.View style={secondLineStyle} />
          </View>
          <View style={styles.stepColumn}>
            <View
              style={[
                styles.stepDot,
                (configStep === "confirm" || configStep === "loading") &&
                  styles.activeStepDot,
              ].filter(Boolean)}
            />
            <View style={styles.stepLabelContainer}>
              <Text
                style={[
                  styles.stepLabel,
                  (configStep === "confirm" || configStep === "loading") &&
                    styles.activeStepLabel,
                ].filter(Boolean)}
              >
                Confirm
              </Text>
            </View>
          </View>
        </View>

        {configStep === "difficulty"
          ? renderDifficultyStep()
          : configStep === "duration"
          ? renderDurationStep()
          : renderConfirmStep()}
      </Animated.View>
    )
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
                <Animated.View style={[styles.favoriteButton, starStyle]}>
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

        {/* Loading overlay only for initial topic load */}
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
          <Animated.View style={[styles.modalContainer, modalStyle]}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={handleCloseModal}
            />
            <GestureDetector gesture={gesture}>
              <Animated.View style={[styles.modalContent, modalContentStyle]}>
                {renderModalContent()}
              </Animated.View>
            </GestureDetector>
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
  modalBackButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
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
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
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
  modalBackButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
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
  modalStep: {
    padding: theme.spacing.xl,
  },
  stepContainer: {
    height: 550, // Increased from 400 to show all options
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  stepColumn: {
    alignItems: "center",
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border.dark,
    marginBottom: theme.spacing.xs,
  },
  activeStepDot: {
    backgroundColor: theme.colors.primary,
    width: 10,
    height: 10,
  },
  completedStepDot: {
    backgroundColor: theme.colors.primary,
    width: 10,
    height: 10,
  },
  stepLineContainer: {
    flex: 1,
    height: 2,
    marginHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    position: "relative",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border.dark,
  },
  stepLabelContainer: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  stepLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  activeStepLabel: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  completedStepLabel: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  configOption: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  optionContent: {
    padding: theme.spacing.lg,
  },
  optionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  selectedOptionText: {
    color: theme.colors.primary,
  },
  durationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  difficultyOption: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  loadingStepContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  confirmationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  confirmationLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
  confirmationValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  startButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
  },
  confirmStepContent: {
    flex: 1,
    justifyContent: "space-between",
    height: "100%",
    paddingBottom: theme.spacing.xl,
  },
})
