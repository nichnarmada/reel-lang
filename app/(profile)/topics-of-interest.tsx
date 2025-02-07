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
import { ChevronLeft, Search, X, Tag, Settings2 } from "lucide-react-native"
import { UserGeneratedTopic } from "../../types/user"
import { useUserTopics } from "../../hooks/useUserTopics"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"

interface TopicItemProps {
  topic: UserGeneratedTopic
  onRemove: () => Promise<void>
}

const TopicItem = ({ topic, onRemove }: TopicItemProps) => {
  const handleRemove = () => {
    Alert.alert(
      "Remove Topic",
      "Are you sure you want to remove this topic? Your learning history will be preserved but the topic won't appear in your lists anymore.",
      [
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await onRemove()
            } catch (err) {
              Alert.alert("Error", "Failed to remove topic. Please try again.")
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    )
  }

  return (
    <View style={styles.topicItem}>
      <View style={styles.topicMain}>
        <View style={styles.topicHeader}>
          <View style={styles.topicInfo}>
            {topic.emoji && (
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
            )}
            <Text style={styles.topicName}>{topic.name}</Text>
          </View>
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.topicMeta}>
          <View style={styles.categoryBadge}>
            <Tag size={14} color="#666" />
            <Text style={styles.categoryText}>
              {topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
            </Text>
          </View>
          {topic.selectedDifficulty && (
            <View style={styles.difficultyBadge}>
              <Settings2 size={14} color="#8a2be2" />
              <Text style={styles.difficultyText}>
                {topic.selectedDifficulty}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default function TopicsSettingsScreen() {
  const { topics, loading, error, categories, removeTopic } = useUserTopics()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredTopics = Object.entries(topics).filter(
    ([_, topic]) =>
      (!searchQuery ||
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedCategory || topic.category === selectedCategory)
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading topics...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} />
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
          <Text style={styles.headerTitle}>Topics Settings</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Manage Your Topics</Text>
            <Text style={styles.infoText}>
              Here you can manage topics you've interacted with. Remove topics
              you're no longer interested in to keep your learning focused.
            </Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search topics..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

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
              onPress={() => setSelectedCategory(null)}
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
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Topics List */}
          <View style={styles.section}>
            {filteredTopics.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No topics found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery || selectedCategory
                    ? "Try adjusting your search or filters"
                    : "Start exploring topics from the discovery page"}
                </Text>
              </View>
            ) : (
              <View style={styles.topicsList}>
                {filteredTopics.map(([topicId, topic]) => (
                  <TopicItem
                    key={topicId}
                    topic={topic}
                    onRemove={() => removeTopic(topicId)}
                  />
                ))}
              </View>
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
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    margin: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchBar: {
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
  categoriesContainer: {
    padding: 16,
    paddingTop: 0,
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
  section: {
    padding: 16,
  },
  topicsList: {
    gap: 12,
  },
  topicItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
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
  removeButton: {
    padding: 4,
  },
  topicMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#8a2be215",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
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
})
