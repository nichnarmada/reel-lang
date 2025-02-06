import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native"
import { router } from "expo-router"
import { useAuth } from "../../contexts/auth"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import { Search, Shuffle } from "lucide-react-native"
import { allCategories } from "@/constants/topics"
import { useUserPreferences } from "../../hooks/useUserPreferences"
import { useTopicSuggestions } from "../../hooks/useTopicSuggestions"
import { colorManager } from "../../constants/categoryColors"

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
  const handleTopicSelect = (topic: any) => {
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
        searchTerms: topic.searchTerms,
        relatedTopics: topic.relatedTopics,
      },
    })
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
          <Text style={styles.headerTitle}>What would you like to learn?</Text>
          <Text style={styles.headerSubtitle}>
            Type a topic or question, and we'll help you discover relevant
            content
          </Text>
          <View style={styles.searchContainer}>
            <Search size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="e.g. 'Python programming' or 'Ancient Egypt'"
              placeholderTextColor="#888"
              onSubmitEditing={handleTopicSelect}
              returnKeyType="search"
            />
          </View>

          {/* AI Generated Topic Suggestions */}
          <View style={styles.suggestedTopics}>
            <View style={styles.topicBadges}>
              {displayedSuggestions.map((topic) => {
                const colors = colorManager.getNextColor()
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
  },
  section: {
    marginBottom: 40,
  },
  centeredSection: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
    textAlign: "center",
  },
  goalsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
  },
  goalBadge: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  goalBadgeText: {
    color: "#1a1a1a",
    fontSize: 14,
    marginRight: 8,
  },
  removeButton: {
    padding: 2,
  },
  contentScrollContainer: {
    paddingHorizontal: 20,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  topicIcon: {
    marginRight: 4,
  },
  topicText: {
    fontSize: 14,
    color: "#1a1a1a",
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#8a2be2",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  suggestedTopics: {
    width: "100%",
    maxWidth: 600,
    marginTop: 24,
  },
  topicBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  topicBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 4,
    marginBottom: 4,
  },
  topicBadgeIcon: {
    marginRight: 6,
  },
  topicBadgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  shuffleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    width: "100%",
  },
  shuffleText: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  shuffleIconContainer: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 20,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  topicEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
})
