import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native"
import { useLocalSearchParams, Stack, router } from "expo-router"
import { useTopics } from "../../contexts/topics"
import { Topic } from "../../types/topic"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import { ChevronLeft, Play, BookOpen } from "lucide-react-native"

export default function TopicDetailsScreen() {
  const { id } = useLocalSearchParams()
  const { topics } = useTopics()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTopic = async () => {
      try {
        // Find topic in our context
        const foundTopic = topics.find((t) => t.id === id)
        if (!foundTopic) {
          throw new Error("Topic not found")
        }
        setTopic(foundTopic)
      } catch (err) {
        console.error("Error loading topic:", err)
        setError(err instanceof Error ? err.message : "Failed to load topic")
      } finally {
        setLoading(false)
      }
    }

    loadTopic()
  }, [id, topics])

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
          title: topic.name,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{topic.name}</Text>
          <Text style={styles.description}>{topic.description}</Text>
          <View style={styles.metadata}>
            <View style={styles.difficultyBadges}>
              {topic.availableDifficulties.map((difficulty) => (
                <View
                  key={difficulty}
                  style={[styles.badge, styles.difficultyBadge]}
                >
                  <Text style={styles.badgeText}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.badgeText}>{topic.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push("/reels")}
          >
            <Play size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Start Learning</Text>
          </TouchableOpacity>
        </View>

        {topic.relatedTopics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Topics</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedTopics}
            >
              {topic.relatedTopics.map((relatedId) => {
                const relatedTopic = topics.find((t) => t.id === relatedId)
                if (!relatedTopic) return null
                return (
                  <TouchableOpacity
                    key={relatedId}
                    style={styles.relatedTopicCard}
                    onPress={() => router.push(`/topic/${relatedId}`)}
                  >
                    <BookOpen size={20} color="#666" />
                    <Text style={styles.relatedTopicTitle}>
                      {relatedTopic.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  difficultyBadges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  difficultyBadge: {
    backgroundColor: "#8a2be215",
  },
  categoryBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    color: "#666",
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#8a2be2",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  relatedTopics: {
    gap: 12,
    paddingRight: 20,
  },
  relatedTopicCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    minWidth: 150,
  },
  relatedTopicTitle: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#8a2be2",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
