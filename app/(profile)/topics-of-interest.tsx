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
import { theme } from "../../constants/theme"

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
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    paddingTop: Platform.OS === "ios" ? 60 : theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  infoTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  searchContainer: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
  },
  categoriesContainer: {
    padding: theme.spacing.md,
    paddingTop: 0,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.tertiary,
    marginRight: theme.spacing.sm,
  },
  selectedCategory: {
    backgroundColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  selectedCategoryText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.weights.medium,
  },
  section: {
    padding: theme.spacing.md,
  },
  topicsList: {
    gap: theme.spacing.md,
  },
  topicItem: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  topicMain: {
    padding: theme.spacing.md,
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
    fontSize: theme.typography.sizes.xxl,
    marginRight: theme.spacing.sm,
  },
  topicName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    flex: 1,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  topicMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  categoryText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  difficultyText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  emptyState: {
    padding: theme.spacing.xxl,
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
})
