import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native"
import { Stack, router } from "expo-router"
import {
  ChevronLeft,
  Search,
  Clock,
  MoreVertical,
  Filter,
} from "lucide-react-native"
import { UserGeneratedTopic } from "../../types/user"
import { formatDistanceToNow } from "date-fns"
import { useUserTopics } from "../../hooks/useUserTopics"

interface TopicItemProps {
  topic: UserGeneratedTopic
  onPress: () => void
  onDelete: () => Promise<void>
}

const TopicItem = ({ topic, onPress, onDelete }: TopicItemProps) => {
  const handleMorePress = () => {
    Alert.alert("Topic Options", "What would you like to do with this topic?", [
      {
        text: "Remove Topic",
        style: "destructive",
        onPress: async () => {
          try {
            await onDelete()
          } catch (err) {
            Alert.alert("Error", "Failed to remove topic. Please try again.")
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ])
  }

  return (
    <TouchableOpacity style={styles.topicItem} onPress={onPress}>
      <View style={styles.topicMain}>
        <View style={styles.topicHeader}>
          <View style={styles.topicInfo}>
            {topic.emoji && (
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            )}
            <Text style={styles.topicName}>{topic.name}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
            <MoreVertical size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.topicMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{topic.category}</Text>
          </View>
          {topic.lastAccessed && (
            <View style={styles.lastAccessed}>
              <Clock size={12} color="#666" />
              <Text style={styles.lastAccessedText}>
                {formatDistanceToNow(new Date(topic.lastAccessed.toMillis()), {
                  addSuffix: true,
                })}
              </Text>
            </View>
          )}
        </View>
        {topic.selectedDifficulty && (
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>
              {topic.selectedDifficulty}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function TopicsOfInterestScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const {
    topics,
    loading,
    error,
    categories,
    recentTopics,
    filteredTopics,
    filterTopics,
    removeTopic,
  } = useUserTopics()

  const handleTopicPress = (topic: UserGeneratedTopic) => {
    router.push({
      pathname: "/topic/[id]" as const,
      params: {
        id: topic.id,
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Topics of Interest</Text>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search topics..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text)
                filterTopics(text, selectedCategory)
              }}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Recent Topics */}
          {recentTopics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Topics</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentTopicsContainer}
              >
                {recentTopics.map(([topicId, topic]) => (
                  <TouchableOpacity
                    key={topicId}
                    style={styles.recentTopicCard}
                    onPress={() => handleTopicPress(topic)}
                  >
                    {topic.emoji && (
                      <Text style={styles.recentTopicEmoji}>{topic.emoji}</Text>
                    )}
                    <Text style={styles.recentTopicName}>{topic.name}</Text>
                    <Text style={styles.recentTopicCategory}>
                      {topic.category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.selectedCategory,
              ]}
              onPress={() => {
                setSelectedCategory(null)
                filterTopics(searchQuery, null)
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.selectedCategoryText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.selectedCategory,
                ]}
                onPress={() => {
                  setSelectedCategory(category)
                  filterTopics(searchQuery, category)
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* All Topics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Topics</Text>
            {filteredTopics.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No topics found</Text>
              </View>
            ) : (
              filteredTopics.map(([topicId, topic]) => (
                <TopicItem
                  key={topicId}
                  topic={topic}
                  onPress={() => handleTopicPress(topic)}
                  onDelete={() => removeTopic(topicId)}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>
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
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },
  recentTopicsContainer: {
    paddingRight: 16,
    gap: 12,
  },
  recentTopicCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    width: 140,
    alignItems: "center",
  },
  recentTopicEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  recentTopicName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  recentTopicCategory: {
    fontSize: 12,
    color: "#666",
  },
  categoriesContainer: {
    padding: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: "#8a2be2",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#666",
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "500",
  },
  topicItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  topicMain: {
    padding: 16,
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  topicInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  topicEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  moreButton: {
    padding: 4,
  },
  topicMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
  },
  lastAccessed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lastAccessedText: {
    fontSize: 12,
    color: "#666",
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#8a2be215",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  difficultyText: {
    fontSize: 12,
    color: "#8a2be2",
    fontWeight: "500",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
})
