import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native"
import { LineChart } from "lucide-react-native"
import { TopicProgress } from "../../types/topic"

// Example data - would come from Firestore in production
const TOPIC_PROGRESS: TopicProgress[] = [
  {
    topicId: "tech_topic",
    userId: "user123",
    masteryLevel: 75,
    videosWatched: 12,
    quizzesTaken: 5,
    averageScore: 85,
    lastActivity: new Date(),
    achievements: [],
  },
  {
    topicId: "science_topic",
    userId: "user123",
    masteryLevel: 45,
    videosWatched: 8,
    quizzesTaken: 3,
    averageScore: 70,
    lastActivity: new Date(),
    achievements: [],
  },
  // Add more topics...
]

const RECENT_ACHIEVEMENTS = [
  {
    id: "1",
    title: "Tech Explorer",
    description: "Watched 10 technology videos",
    date: "2024-02-20",
    icon: "🏆",
  },
  {
    id: "2",
    title: "Quiz Master",
    description: "Completed 5 quizzes with 90%+ score",
    date: "2024-02-19",
    icon: "🎯",
  },
  // Add more achievements...
]

export default function ProgressScreen() {
  const renderTopicProgress = ({ item }: { item: TopicProgress }) => (
    <TouchableOpacity style={styles.topicCard}>
      <View style={styles.topicHeader}>
        <Text style={styles.topicTitle}>{item.topicId}</Text>
        <Text style={styles.masteryLabel}>{item.masteryLevel}% Mastery</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[styles.progressBar, { width: `${item.masteryLevel}%` }]}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.videosWatched}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.quizzesTaken}</Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.averageScore}%</Text>
          <Text style={styles.statLabel}>Avg. Score</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      {/* Overview Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Learning Progress</Text>
        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>15</Text>
            <Text style={styles.overviewLabel}>Day Streak</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>42</Text>
            <Text style={styles.overviewLabel}>Videos Watched</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>18</Text>
            <Text style={styles.overviewLabel}>Quizzes Completed</Text>
          </View>
        </View>
      </View>

      {/* Topic Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topic Progress</Text>
        <FlatList
          data={TOPIC_PROGRESS}
          renderItem={renderTopicProgress}
          keyExtractor={(item) => item.topicId}
          scrollEnabled={false}
        />
      </View>

      {/* Recent Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        {RECENT_ACHIEVEMENTS.map((achievement) => (
          <View key={achievement.id} style={styles.achievementCard}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementContent}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
              <Text style={styles.achievementDate}>{achievement.date}</Text>
            </View>
          </View>
        ))}
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
    marginBottom: 16,
  },
  overviewCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewItem: {
    flex: 1,
    alignItems: "center",
  },
  overviewDivider: {
    width: 1,
    backgroundColor: "#eee",
    marginHorizontal: 8,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196f3",
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
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
  topicCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  masteryLabel: {
    fontSize: 14,
    color: "#2196f3",
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2196f3",
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  achievementCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: "#999",
  },
})
