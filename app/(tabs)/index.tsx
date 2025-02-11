import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  Modal,
} from "react-native"
import { router } from "expo-router"
import { useAuth } from "../../contexts/auth"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import { Search, Shuffle, Send } from "lucide-react-native"
import { allCategories } from "@/constants/topics"
import { useUserPreferences } from "../../hooks/useUserPreferences"
import { useTopicSuggestions } from "../../hooks/useTopicSuggestions"
import { colorManager } from "../../constants/categoryColors"
import { GeneratedTopic } from "../../types/topic"
import { generateTopicSuggestions } from "../../services/topics/topicGenerator"
import { theme } from "../../constants/theme"
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
  runOnJS,
} from "react-native-reanimated"

interface AIModalProps {
  visible: boolean
  onTopicSelect: (topic: GeneratedTopic) => void
  onClose: () => void
  searchQuery: string
  userId: string
}

const AIThinkingModal = ({
  visible,
  onTopicSelect,
  onClose,
  searchQuery,
  userId,
}: AIModalProps) => {
  const [dots, setDots] = useState("...")
  const [modalVisible, setModalVisible] = useState(visible)
  const fadeAnim = useSharedValue(0)
  const [isThinking, setIsThinking] = useState(true)
  const [suggestedTopics, setSuggestedTopics] = useState<GeneratedTopic[]>([])
  const [error, setError] = useState<string | null>(null)

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }))

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(fadeAnim.value, [0, 1], [0.95, 1]),
      },
    ],
  }))

  const generateTopics = async () => {
    try {
      const result = await generateTopicSuggestions({
        userId,
        preferredCategories: [searchQuery],
        topicNumber: 6,
      })

      // Get the topics from the first category in the result
      const firstCategory = Object.values(result)[0] || []
      setSuggestedTopics(firstCategory)
      setIsThinking(false)
    } catch (err) {
      console.error("Error generating topics:", err)
      setError(err instanceof Error ? err.message : "Failed to generate topics")
      setIsThinking(false)
    }
  }

  useEffect(() => {
    if (visible) {
      setModalVisible(true)
      setIsThinking(true)
      setError(null)
      fadeAnim.value = withTiming(1, { duration: 200 })

      // Generate topics when modal becomes visible
      generateTopics()
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false)
          runOnJS(setIsThinking)(true)
          runOnJS(setSuggestedTopics)([])
          runOnJS(setError)(null)
        }
      })
    }
  }, [visible, searchQuery])

  useEffect(() => {
    if (modalVisible && isThinking) {
      const interval = setInterval(() => {
        setDots((current) => (current.length >= 3 ? "" : current + "."))
      }, 500)
      return () => clearInterval(interval)
    }
  }, [modalVisible, isThinking])

  // Get colors for topics
  const topicColors = useMemo(() => {
    return suggestedTopics.map(() => colorManager.getNextColor())
  }, [suggestedTopics])

  if (!modalVisible) return null

  return (
    <Modal transparent visible={modalVisible} animationType="none">
      <Animated.View style={[styles.modalOverlay, overlayStyle]}>
        <Animated.View style={[styles.modalContent, contentStyle]}>
          <View style={styles.modalCard}>
            {isThinking ? (
              <>
                <Text style={styles.thinkingText}>AI is thinking{dots}</Text>
                <Text style={styles.thinkingSubtext}>
                  Finding the perfect topics for you
                </Text>
              </>
            ) : error ? (
              <>
                <Text style={styles.errorText}>Oops! Something went wrong</Text>
                <Text style={styles.errorSubtext}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setIsThinking(true)
                    generateTopics()
                  }}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.resultsTitle}>Suggested Topics</Text>
                <View style={styles.topicResults}>
                  {suggestedTopics.map((topic, index) => {
                    const colors = topicColors[index]
                    return (
                      <TouchableOpacity
                        key={`${topic.category}-${topic.name}`}
                        style={[
                          styles.topicResultItem,
                          { backgroundColor: colors.background },
                        ]}
                        onPress={() => {
                          onTopicSelect(topic)
                          onClose()
                        }}
                      >
                        <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                        <Text
                          style={[
                            styles.topicBadgeText,
                            { color: colors.text },
                          ]}
                        >
                          {topic.name}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

export default function DiscoverScreen() {
  const { user } = useAuth()
  const {
    preferences,
    loading: userPreferencesLoading,
    error: userPreferencesError,
  } = useUserPreferences(user?.uid || "")
  const {
    displayedSuggestions,
    loading: topicSuggestionsLoading,
    errors: topicSuggestionsErrors,
    shuffleSuggestions,
    refreshSuggestions: refreshTopicSuggestions,
  } = useTopicSuggestions(user?.uid || "")

  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Function to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // State for suggested topics
  const [suggestedTopics, setSuggestedTopics] = useState(() =>
    shuffleArray(allCategories).slice(0, 6)
  )

  // Function to get new suggestions
  const refreshSuggestions = () => {
    setSuggestedTopics(shuffleArray(allCategories).slice(0, 6))
  }

  // Function to handle topic selection
  const handleTopicSelect = (topic: GeneratedTopic) => {
    // Generate a consistent ID for the topic
    const topicId = `${topic.category}-${topic.name
      .toLowerCase()
      .replace(/\s+/g, "-")}`

    // Navigate with all topic data
    router.push({
      pathname: "/topic/[id]" as const,
      params: {
        id: topicId,
        isGenerated: "true",
        category: topic.category,
        name: topic.name,
        description: topic.description,
        emoji: topic.emoji,
        reasonForSuggestion: topic.reasonForSuggestion,
        confidence: topic.confidence.toString(),
        searchTerms: JSON.stringify(topic.searchTerms),
        relatedTopics: JSON.stringify(topic.relatedTopics),
        originTab: "index",
      },
    })
  }

  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchQuery.trim().length === 0) return
    setIsModalVisible(true)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshTopicSuggestions()
    } catch (err) {
      console.error("Error refreshing content:", err)
      setLoadError(
        err instanceof Error ? err.message : "Failed to refresh content"
      )
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      onRefresh()
    }
  }, [user])

  // Combine loading states
  const isLoading = userPreferencesLoading || topicSuggestionsLoading

  // Combine error states
  const combinedError =
    userPreferencesError || topicSuggestionsErrors.general || loadError

  // Memoize topic colors to keep them stable across re-renders
  const topicColors = useMemo(() => {
    return displayedSuggestions.map(() => colorManager.getNextColor())
  }, [displayedSuggestions]) // Only regenerate colors when suggestions change

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>
          Loading your personalized content...
        </Text>
      </View>
    )
  }

  if (combinedError) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={combinedError} />
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>
          Please sign in to view your personalized content
        </Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.mainContent}>
          {/* Centered Header with Search */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              What would you like to learn?
            </Text>
            <Text style={styles.headerSubtitle}>
              Type a topic or question, and we'll help you discover relevant
              content
            </Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="e.g. 'Ancient Egypt' or 'Politics'"
                placeholderTextColor="#888"
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { opacity: searchQuery.trim().length > 0 ? 1 : 0.5 },
                ]}
                onPress={handleSearchSubmit}
                disabled={searchQuery.trim().length === 0}
              >
                <Send size={20} color="#8a2be2" />
              </TouchableOpacity>
            </View>

            {/* AI Generated Topic Suggestions */}
            <View style={styles.suggestedTopics}>
              <View style={styles.topicBadges}>
                {displayedSuggestions.map((topic, index) => {
                  const colors = topicColors[index]
                  return (
                    <TouchableOpacity
                      key={`${topic.category}-${topic.name}`}
                      style={[
                        styles.topicBadge,
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => handleTopicSelect(topic)}
                      accessibilityLabel={`Learn about ${topic.name}`}
                    >
                      {topic.emoji && (
                        <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                      )}
                      <Text
                        style={[styles.topicBadgeText, { color: colors.text }]}
                      >
                        {topic.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity
                style={styles.shuffleButton}
                onPress={() => {
                  colorManager.reset() // Reset color pool when shuffling
                  shuffleSuggestions()
                }}
                accessibilityLabel="Show different topics"
              >
                <Text style={styles.shuffleText}>Discover something new</Text>
                <View style={styles.shuffleIconContainer}>
                  <Shuffle size={16} color="#666" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <AIThinkingModal
        visible={isModalVisible}
        onTopicSelect={handleTopicSelect}
        onClose={() => setIsModalVisible(false)}
        searchQuery={searchQuery}
        userId={user?.uid || ""}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flexGrow: 1,
    minHeight: "100%",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1a1a1a",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    width: "100%",
    maxWidth: 600,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    color: "#1a1a1a",
    paddingRight: 12,
  },
  sendButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  centeredSection: {
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  goalsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  goalBadge: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  goalBadgeText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    marginRight: theme.spacing.sm,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  contentScrollContainer: {
    paddingHorizontal: theme.spacing.xl,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: 600,
  },
  topicButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
  },
  topicIcon: {
    marginRight: theme.spacing.xs,
  },
  topicText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
  },
  contentCard: {
    width: 200,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  contentImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  contentPlaceholder: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  contentTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    margin: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  messageText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  suggestedTopics: {
    width: "100%",
    maxWidth: 600,
    marginTop: theme.spacing.xl,
  },
  topicBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  topicBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  topicBadgeIcon: {
    marginRight: theme.spacing.xs,
  },
  topicBadgeText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  shuffleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    alignSelf: "center",
    paddingHorizontal: theme.spacing.md,
  },
  shuffleText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  shuffleIconContainer: {
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  topicEmoji: {
    fontSize: theme.typography.sizes.md,
    marginRight: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  modalCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.medium,
  },
  thinkingText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  thinkingSubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  resultsTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  topicResults: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.sm,
    width: "100%",
  },
  topicResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  closeButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    alignSelf: "center",
  },
  closeButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#dc3545",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
})
