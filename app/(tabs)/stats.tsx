import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native"
import { router } from "expo-router"
import {
  ChevronRight,
  Clock,
  Brain,
  History,
  Sparkles,
} from "lucide-react-native"
import { useAuth } from "../../contexts/auth"
import { getDocument, FIREBASE_COLLECTIONS } from "../../utils/firebase/config"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import { UserStats } from "../../types/user"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const CARD_MARGIN = 8
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_MARGIN * 2) / 2

export default function StatsScreen() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const userDoc = getDocument(FIREBASE_COLLECTIONS.USERS, user.uid)
    const unsubscribe = userDoc.onSnapshot(
      (doc) => {
        if (doc.exists) {
          setStats(doc.data()?.stats || null)
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error loading stats:", err)
        setError("Failed to load stats")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    )
  }

  if (error || !stats) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error || "Stats not found"} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning Journey</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/quiz-history")}
        >
          <History size={20} color="#8a2be2" />
          <Text style={styles.actionButtonText}>Learning History</Text>
          <ChevronRight size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statsCard, styles.cardPurple]}>
          <Clock size={24} color="#8a2be2" />
          <Text style={styles.statValue}>
            {Math.round(stats.totalLearningTime / 60)}h
          </Text>
          <Text style={styles.statLabel}>Learning Time</Text>
        </View>

        <View style={[styles.statsCard, styles.cardBlue]}>
          <Brain size={24} color="#4a90e2" />
          <Text style={styles.statValue}>
            {stats.topicsProgress.explored.length}
          </Text>
          <Text style={styles.statLabel}>Topics Explored</Text>
        </View>

        <View style={[styles.statsCard, styles.cardGreen]}>
          <Sparkles size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.learningStreaks.current}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={[styles.statsCard, styles.cardOrange]}>
          <History size={24} color="#ff9800" />
          <Text style={styles.statValue}>{stats.sessionsCompleted}</Text>
          <Text style={styles.statLabel}>Sessions Done</Text>
        </View>
      </View>

      {/* Learning Streak */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Streak</Text>
        <View style={styles.streakCard}>
          <View style={styles.streakInfo}>
            <Text style={styles.streakValue}>
              {stats.learningStreaks.current}
            </Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakValue}>
              {stats.learningStreaks.longest}
            </Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>
      </View>

      {/* Recent Topics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Topics</Text>
        <View style={styles.topicsList}>
          {stats.topicsProgress.explored.slice(0, 3).map((topic) => (
            <View key={topic.topicId} style={styles.topicItem}>
              <View>
                <Text style={styles.topicName}>{topic.topicName}</Text>
                <Text style={styles.topicStats}>
                  {Math.round(topic.timeSpent / 60)}h spent learning
                  {topic.subTopics &&
                    topic.subTopics.length > 0 &&
                    ` · ${topic.subTopics.length} sub-topics`}
                </Text>
              </View>
              {topic.parentTopic && (
                <View style={styles.parentTopicBadge}>
                  <Text style={styles.parentTopicText}>
                    Part of {topic.parentTopic}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
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
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  quickActions: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
  },
  statsCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  cardPurple: {
    backgroundColor: "#8a2be215",
  },
  cardBlue: {
    backgroundColor: "#4a90e215",
  },
  cardGreen: {
    backgroundColor: "#4CAF5015",
  },
  cardOrange: {
    backgroundColor: "#ff980015",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  streakCard: {
    flexDirection: "row",
    backgroundColor: "#8a2be215",
    borderRadius: 12,
    padding: 16,
  },
  streakInfo: {
    flex: 1,
    alignItems: "center",
  },
  streakValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#8a2be2",
  },
  streakLabel: {
    fontSize: 14,
    color: "#666",
  },
  topicsList: {
    gap: 12,
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  topicStats: {
    fontSize: 14,
    color: "#666",
  },
  parentTopicBadge: {
    marginLeft: "auto",
    backgroundColor: "#8a2be215",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  parentTopicText: {
    color: "#8a2be2",
    fontSize: 12,
    fontWeight: "500",
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
