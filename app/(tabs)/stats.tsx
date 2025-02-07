import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  TextInput,
} from "react-native"
import { router } from "expo-router"
import {
  Search,
  Filter,
  BarChart2,
  Calendar,
  Play,
  Clock,
} from "lucide-react-native"
import { useAuth } from "../../contexts/auth"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import { format } from "date-fns"
import { useUserTopics } from "../../hooks/useUserTopics"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

export default function StatsScreen() {
  const { user } = useAuth()
  const { topics, loading: topicsLoading, error: topicsError } = useUserTopics()

  if (topicsLoading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    )
  }

  if (topicsError) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={topicsError} />
      </View>
    )
  }

  // Calculate total time and sessions from topics
  const totalTimeSpent = Object.values(topics).reduce(
    (acc, topic) => acc + topic.stats.totalTimeSpent,
    0
  )
  const totalSessions = Object.values(topics).reduce(
    (acc, topic) => acc + topic.stats.totalSessions,
    0
  )
  const activeTopics = Object.keys(topics).length

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning Journey</Text>
      </View>

      {/* Learning Journey Summary */}
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Your Learning Journey</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{totalTimeSpent}</Text>
            <Text style={styles.summaryStatLabel}>Minutes Learned</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{totalSessions}</Text>
            <Text style={styles.summaryStatLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{activeTopics}</Text>
            <Text style={styles.summaryStatLabel}>Active Topics</Text>
          </View>
        </View>
      </View>

      {/* Topic Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topic Progress</Text>

        {/* Search and Sort */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search topics..."
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Topic List */}
        <View style={styles.topicProgressList}>
          {Object.entries(topics).map(([topicId, topic]) => (
            <View key={topicId} style={styles.progressTopicItem}>
              <View style={styles.topicMain}>
                <View style={styles.topicHeader}>
                  <View style={styles.titleRow}>
                    {topic.emoji && (
                      <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                    )}
                    <Text style={styles.progressTopicName}>{topic.name}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {topic.category.charAt(0).toUpperCase() +
                        topic.category.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.topicStats}>
                  <View style={styles.statItem}>
                    <Clock size={14} color="#666" />
                    <Text style={styles.statText}>
                      {topic.stats.totalTimeSpent} mins total
                    </Text>
                  </View>
                  <Text style={styles.statDivider}>•</Text>
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>
                      {topic.stats.totalSessions} sessions
                    </Text>
                  </View>
                  <Text style={styles.statDivider}>•</Text>
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>
                      Last:{" "}
                      {format(
                        new Date(topic.stats.lastSessionDate.seconds * 1000),
                        "MMM d"
                      )}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => router.push(`/topic/${topicId}`)}
                >
                  <Play size={16} color="#8a2be2" />
                  <Text style={styles.continueButtonText}>
                    Continue Learning
                  </Text>
                </TouchableOpacity>
              </View>
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
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
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
  topicProgressList: {
    gap: 12,
  },
  progressTopicItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 4,
  },
  topicMain: {
    padding: 16,
  },
  topicHeader: {
    marginBottom: 12,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topicEmoji: {
    fontSize: 24,
  },
  progressTopicName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
  },
  topicStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: "#666",
  },
  statDivider: {
    color: "#666",
    marginHorizontal: 8,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#8a2be215",
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    color: "#8a2be2",
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
  summaryHeader: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryStatItem: {
    alignItems: "center",
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#8a2be2",
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: "#666",
  },
})
