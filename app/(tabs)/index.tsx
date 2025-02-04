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
  Image,
} from "react-native"
import { router } from "expo-router"
import { useTopics } from "../../contexts/topics"
import { useAuth } from "../../contexts/auth"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import {
  Search,
  X,
  BookOpen,
  Code,
  History,
  Palette,
  Brain,
  Music,
  Globe,
  Shuffle,
  Camera,
  Dumbbell,
  ChefHat,
  Leaf,
  FlaskConical,
} from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { RelatedContent, TopicSuggestion } from "../../types/topic"

export default function DiscoverScreen() {
  const { user } = useAuth()
  const {
    topics,
    userPreferences,
    relatedContent,
    suggestions,
    loading,
    error,
    addLearningGoal,
    removeLearningGoal,
    selectTopic,
    refreshTopics,
  } = useTopics()

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

  // All possible topics
  const allTopics = [
    { id: "programming", title: "Programming", icon: Code, color: "#FF6B6B" },
    { id: "history", title: "History", icon: History, color: "#4ECDC4" },
    { id: "art", title: "Art & Design", icon: Palette, color: "#9D50BB" },
    { id: "psychology", title: "Psychology", icon: Brain, color: "#45B7D1" },
    { id: "music", title: "Music", icon: Music, color: "#96C93D" },
    { id: "languages", title: "Languages", icon: Globe, color: "#FF9A8B" },
    { id: "photography", title: "Photography", icon: Camera, color: "#FF85A1" },
    { id: "fitness", title: "Fitness", icon: Dumbbell, color: "#45B7AF" },
    { id: "cooking", title: "Cooking", icon: ChefHat, color: "#FFA07A" },
    { id: "nature", title: "Nature", icon: Leaf, color: "#98FB98" },
    { id: "science", title: "Science", icon: FlaskConical, color: "#87CEEB" },
  ]

  // State for suggested topics
  const [suggestedTopics, setSuggestedTopics] = useState(() =>
    shuffleArray(allTopics).slice(0, 6)
  )

  // Function to get new suggestions
  const refreshSuggestions = () => {
    setSuggestedTopics(shuffleArray(allTopics).slice(0, 6))
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshTopics()
    } catch (err) {
      console.error("Error refreshing topics:", err)
      setLoadError(
        err instanceof Error ? err.message : "Failed to refresh topics"
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      await addLearningGoal({
        title: searchQuery.trim(),
        tags: [], // We can enhance this with AI tag suggestions later
      })
      setSearchQuery("")
    } catch (err) {
      console.error("Error adding learning goal:", err)
      setLoadError(
        err instanceof Error ? err.message : "Failed to add learning goal"
      )
    }
  }

  const handleTopicSelect = async (topic: string) => {
    try {
      await addLearningGoal({
        title: topic,
        tags: [topic.toLowerCase()],
      })
    } catch (err) {
      console.error("Error adding topic:", err)
      setLoadError(err instanceof Error ? err.message : "Failed to add topic")
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>
          Loading your personalized content...
        </Text>
      </View>
    )
  }

  if (error || loadError) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage
          message={error || loadError || "An unexpected error occurred"}
        />
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
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          {/* Suggested Topics */}
          <View style={styles.suggestedTopics}>
            <View style={styles.topicBadges}>
              {suggestedTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicBadge,
                    { backgroundColor: topic.color + "15" },
                  ]}
                  onPress={() => handleTopicSelect(topic.title)}
                  accessibilityLabel={`Select ${topic.title} as a learning goal`}
                >
                  <topic.icon
                    size={16}
                    color={topic.color}
                    style={styles.topicBadgeIcon}
                  />
                  <Text style={[styles.topicBadgeText, { color: topic.color }]}>
                    {topic.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.shuffleButton}
              onPress={refreshSuggestions}
              accessibilityLabel="Show different topics"
            >
              <Text style={styles.shuffleText}>
                {(userPreferences?.learningGoals ?? []).length > 0
                  ? "Expand your knowledge"
                  : "Discover something new"}
              </Text>
              <View style={styles.shuffleIconContainer}>
                <Shuffle size={16} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Learning Goals */}
        {(userPreferences?.learningGoals ?? []).length > 0 && (
          <View style={[styles.section, styles.centeredSection]}>
            <Text style={styles.sectionTitle}>Your Learning Goals</Text>
            <View style={styles.goalsList}>
              {userPreferences?.learningGoals?.map((goal) => (
                <View key={goal.id} style={styles.goalBadge}>
                  <Text style={styles.goalBadgeText}>{goal.title}</Text>
                  <TouchableOpacity
                    onPress={() => removeLearningGoal(goal.id)}
                    style={styles.removeButton}
                  >
                    <X size={16} color="#8a2be2" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommended Content Section */}
        {relatedContent.length > 0 && (
          <View style={[styles.section, styles.centeredSection]}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contentScrollContainer}
            >
              {relatedContent.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.contentCard}
                  onPress={() => {
                    if (item.type === "video")
                      router.push(`/reels?videoId=${item.id}`)
                    else router.push(`/topics/${item.id}`)
                  }}
                >
                  {item.thumbnail ? (
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={styles.contentImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.contentPlaceholder}>
                      <BookOpen size={24} color="#666" />
                    </View>
                  )}
                  <Text style={styles.contentTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Related Topics Section */}
        {suggestions.length > 0 && (
          <View style={[styles.section, styles.centeredSection]}>
            <Text style={styles.sectionTitle}>You Might Also Like</Text>
            <View style={styles.topicsContainer}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.topicId}
                  style={styles.topicButton}
                  onPress={() =>
                    selectTopic(suggestion.topicId, suggestion.basedOn[0].id)
                  }
                >
                  <BookOpen size={16} color="#333" style={styles.topicIcon} />
                  <Text style={styles.topicText}>
                    {topics.find((t) => t.id === suggestion.topicId)?.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
})
