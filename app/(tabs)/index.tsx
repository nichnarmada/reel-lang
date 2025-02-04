import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native"
import { router } from "expo-router"

// Example topics - these would come from Firestore in production
const TOPICS = [
  {
    id: "1",
    name: "Technology",
    icon: "💻",
    description: "Latest in tech and computing",
  },
  {
    id: "2",
    name: "Science",
    icon: "🔬",
    description: "Discoveries and experiments",
  },
  {
    id: "3",
    name: "History",
    icon: "📚",
    description: "Past events and civilizations",
  },
  {
    id: "4",
    name: "Arts",
    icon: "🎨",
    description: "Creative expressions and culture",
  },
  // Add more topics...
]

export default function DiscoverScreen() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Topics</Text>
        <Text style={styles.subtitle}>Select topics that interest you</Text>
      </View>

      {/* Featured Topics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Topics</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TOPICS.slice(0, 3)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => router.push(`/topics/${item.id}`)}
            >
              <Text style={styles.topicIcon}>{item.icon}</Text>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.description}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* All Topics Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Topics</Text>
        <View style={styles.topicsGrid}>
          {TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicCard,
                selectedTopics.includes(topic.id) && styles.selectedTopic,
              ]}
              onPress={() => toggleTopic(topic.id)}
            >
              <Text style={styles.topicIcon}>{topic.icon}</Text>
              <Text style={styles.topicName}>{topic.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Popular Learning Paths */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Learning Paths</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TOPICS.slice(0, 3)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.pathCard}>
              <Text style={styles.pathIcon}>{item.icon}</Text>
              <Text style={styles.pathTitle}>{`Master ${item.name}`}</Text>
              <Text style={styles.pathDetails}>5 videos • 3 quizzes</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => `path-${item.id}`}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  featuredCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  topicCard: {
    width: "48%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  selectedTopic: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 1,
  },
  topicIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  pathCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pathIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  pathDetails: {
    fontSize: 12,
    color: "#666",
  },
})
