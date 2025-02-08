import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native"
import { Stack, router } from "expo-router"
import { ChevronLeft, Star } from "lucide-react-native"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorMessage } from "../components/ErrorMessage"
import { getConsistentColor } from "../constants/categoryColors"
import { capitalizeText } from "../utils/utils"
import { useSavedTopics, SavedTopic } from "../hooks/useSavedTopics"

export default function SavedTopicsScreen() {
  const { topics, loading, error } = useSavedTopics()

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading saved topics...</Text>
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

  const handleTopicPress = (topic: SavedTopic) => {
    // Generate a consistent ID for the topic
    const topicId = `${topic.category}-${topic.name
      .toLowerCase()
      .replace(/\s+/g, "-")}`

    // Navigate with all topic data
    router.push({
      pathname: "/topic/[id]" as const,
      params: {
        id: topicId,
        isGenerated: topic.isGeneratedTopic.toString(),
        category: topic.category,
        name: topic.name,
        description: topic.description,
        emoji: topic.emoji,
        reasonForSuggestion: topic.reasonForSuggestion,
        confidence: topic.confidence.toString(),
        searchTerms: JSON.stringify(topic.searchTerms),
        relatedTopics: JSON.stringify(topic.relatedTopics),
        originTab: "profile",
      },
    })
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
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Topics</Text>
        </View>

        {topics.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Star size={48} color="#666" />
            <Text style={styles.emptyText}>No saved topics yet</Text>
            <Text style={styles.emptySubtext}>
              Topics you save will appear here for quick access
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.topicsContainer}
          >
            {topics.map((topic) => {
              const colors = getConsistentColor(topic.category)
              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() => handleTopicPress(topic)}
                >
                  <View style={styles.topicHeader}>
                    <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                    <Text style={[styles.topicName, { color: colors.text }]}>
                      {topic.name}
                    </Text>
                  </View>
                  <View style={styles.topicMeta}>
                    <Text style={[styles.categoryText, { color: colors.text }]}>
                      {capitalizeText(topic.category)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}
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
  scrollContainer: {
    flex: 1,
  },
  topicsContainer: {
    padding: 16,
    gap: 12,
  },
  topicCard: {
    borderRadius: 12,
    padding: 16,
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  topicEmoji: {
    fontSize: 24,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  topicMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryText: {
    fontSize: 14,
    opacity: 0.8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
})
