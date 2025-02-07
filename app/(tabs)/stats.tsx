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
  Clock,
  Trophy,
  Target,
  BookOpen,
  Calendar,
  TrendingUp,
} from "lucide-react-native"
import { useAuth } from "../../contexts/auth"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import { format } from "date-fns"
import { useUserTopics } from "../../hooks/useUserTopics"
import { theme } from "../../constants/theme"

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
        <Text style={styles.title}>Statistics</Text>
      </View>

      {/* Overall Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Clock size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{totalTimeSpent}m</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <BookOpen size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{activeTopics}</Text>
            <Text style={styles.statLabel}>Topics</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>
      </View>

      {/* Learning Trends */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Learning Trends</Text>
          <TouchableOpacity style={styles.periodSelector}>
            <Text style={styles.periodText}>This Month</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trendsCard}>
          <View style={styles.trendItem}>
            <View style={styles.trendHeader}>
              <TrendingUp size={20} color={theme.colors.status.success} />
              <Text style={styles.trendValue}>+15%</Text>
            </View>
            <Text style={styles.trendLabel}>Learning Time</Text>
          </View>
          <View style={styles.trendItem}>
            <View style={styles.trendHeader}>
              <TrendingUp size={20} color={theme.colors.status.success} />
              <Text style={styles.trendValue}>+3</Text>
            </View>
            <Text style={styles.trendLabel}>New Topics</Text>
          </View>
        </View>
      </View>

      {/* Topic History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topic History</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search topics..."
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.topicList}>
          {Object.entries(topics).map(([topicId, topic]) => (
            <View key={topicId} style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <View style={styles.topicInfo}>
                  {topic.emoji && (
                    <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                  )}
                  <Text style={styles.topicName}>{topic.name}</Text>
                </View>
                <View style={styles.topicStats}>
                  <Clock size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.topicStatText}>
                    {topic.stats.totalTimeSpent}m
                  </Text>
                </View>
              </View>
              <View style={styles.topicFooter}>
                <Text style={styles.lastStudied}>
                  Last studied:{" "}
                  {format(
                    new Date(topic.stats.lastSessionDate.seconds * 1000),
                    "MMM d"
                  )}
                </Text>
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
    backgroundColor: theme.colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.md,
  },
  header: {
    padding: theme.spacing.md,
    paddingTop: Platform.OS === "ios" ? 60 : theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  section: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - theme.spacing.md * 3 - theme.spacing.sm * 2) / 2,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.small,
  },
  statValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  periodSelector: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  periodText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  trendsCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.small,
  },
  trendItem: {
    alignItems: "center",
  },
  trendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  trendValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.status.success,
  },
  trendLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  searchContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  topicList: {
    gap: theme.spacing.sm,
  },
  topicCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.small,
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  topicInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  topicEmoji: {
    fontSize: theme.typography.sizes.xl,
  },
  topicName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  topicStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  topicStatText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  topicFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  lastStudied: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
})
