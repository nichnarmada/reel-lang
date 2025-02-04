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
import { useTopics } from "../../contexts/topics"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"

export default function DiscoverScreen() {
  const {
    topics,
    featuredTopics,
    topicPaths,
    userPreferences,
    loading,
    error,
    selectTopic,
    unselectTopic,
  } = useTopics()

  console.log("Featured Topics:", featuredTopics)

  const toggleTopic = async (topicId: string) => {
    const isSelected = userPreferences?.selectedTopics.some(
      (topic) => topic.topicId === topicId
    )
    if (isSelected) {
      await unselectTopic(topicId)
    } else {
      await selectTopic(topicId)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error} />
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
          data={featuredTopics}
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
          {topics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicCard,
                userPreferences?.selectedTopics.some(
                  (t) => t.topicId === topic.id
                ) && styles.selectedTopic,
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
          data={topicPaths}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.pathCard}>
              <Text style={styles.pathTitle}>{item.name}</Text>
              <Text style={styles.pathDetails}>
                {item.videoCount} videos • {item.quizCount} quizzes
              </Text>
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
