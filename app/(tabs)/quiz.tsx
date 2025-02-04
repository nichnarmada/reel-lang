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

// Example quiz data - would come from Firestore in production
const QUIZZES = [
  {
    id: "1",
    topic: "Technology",
    title: "Introduction to AI",
    description: "Test your knowledge about AI fundamentals",
    questionCount: 5,
    estimatedTime: "5 mins",
    difficulty: "beginner",
    progress: 0,
  },
  {
    id: "2",
    topic: "Science",
    title: "Basic Physics",
    description: "Core concepts of physics",
    questionCount: 8,
    estimatedTime: "10 mins",
    difficulty: "intermediate",
    progress: 60,
  },
  // Add more quizzes...
]

export default function QuizScreen() {
  const [activeTab, setActiveTab] = useState<"available" | "completed">(
    "available"
  )

  const renderQuizCard = ({ item }) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => router.push(`/quiz/${item.id}`)}
    >
      <View style={styles.quizHeader}>
        <Text style={styles.topicLabel}>{item.topic}</Text>
        <Text style={styles.difficultyLabel}>{item.difficulty}</Text>
      </View>

      <Text style={styles.quizTitle}>{item.title}</Text>
      <Text style={styles.quizDescription}>{item.description}</Text>

      <View style={styles.quizMeta}>
        <Text style={styles.metaText}>
          {item.questionCount} questions • {item.estimatedTime}
        </Text>
      </View>

      {item.progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
          <Text style={styles.progressText}>{item.progress}% Complete</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "available" && styles.activeTab]}
          onPress={() => setActiveTab("available")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "available" && styles.activeTabText,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "completed" && styles.activeTabText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Daily Challenge */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Challenge</Text>
          <TouchableOpacity style={styles.challengeCard}>
            <Text style={styles.challengeTitle}>Today's Quiz Challenge</Text>
            <Text style={styles.challengeDescription}>
              Complete this quiz to maintain your learning streak!
            </Text>
            <Text style={styles.challengeMeta}>3 questions • 3 mins</Text>
          </TouchableOpacity>
        </View>

        {/* Quiz List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeTab === "available"
              ? "Available Quizzes"
              : "Completed Quizzes"}
          </Text>
          <FlatList
            data={QUIZZES}
            renderItem={renderQuizCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196f3",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#2196f3",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  challengeMeta: {
    fontSize: 12,
    color: "#666",
  },
  quizCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  topicLabel: {
    fontSize: 12,
    color: "#2196f3",
    fontWeight: "500",
  },
  difficultyLabel: {
    fontSize: 12,
    color: "#666",
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#2196f3",
    borderRadius: 2,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
  },
})
