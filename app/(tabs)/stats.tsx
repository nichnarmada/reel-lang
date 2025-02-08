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
  Flame,
  Timer,
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
  // Temporarily disable topics loading until stats logic is fully implemented
  // const { topics, loading: topicsLoading, error: topicsError } = useUserTopics()
  const [loading, setLoading] = React.useState(false)

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    )
  }

  // Static data for now
  const stats = {
    totalTimeSpent: 120,
    totalSessions: 8,
    activeTopics: 3,
    achievements: 4,
  }

  const sampleTopics = [
    {
      id: "1",
      name: "Machine Learning",
      emoji: "🤖",
      stats: {
        totalTimeSpent: 45,
        lastStudied: "Apr 15",
      },
    },
    {
      id: "2",
      name: "Web Development",
      emoji: "🌐",
      stats: {
        totalTimeSpent: 35,
        lastStudied: "Apr 14",
      },
    },
    {
      id: "3",
      name: "Data Science",
      emoji: "📊",
      stats: {
        totalTimeSpent: 40,
        lastStudied: "Apr 13",
      },
    },
  ]

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
      </View>

      {/* Today's Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressItem}>
            <Flame size={24} color={theme.colors.primary} />
            <Text style={styles.progressValue}>3</Text>
            <Text style={styles.progressLabel}>Day Streak</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.progressItem}>
            <Timer size={24} color={theme.colors.primary} />
            <Text style={styles.progressValue}>25m</Text>
            <Text style={styles.progressLabel}>Today's Time</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.progressItem}>
            <Target size={24} color={theme.colors.primary} />
            <Text style={styles.progressValue}>30m</Text>
            <Text style={styles.progressLabel}>Daily Goal</Text>
          </View>
        </View>
      </View>

      {/* Overall Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Clock size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{stats.totalTimeSpent}m</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <BookOpen size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{stats.activeTopics}</Text>
            <Text style={styles.statLabel}>Topics</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{stats.achievements}</Text>
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
          {sampleTopics.map((topic) => (
            <View key={topic.id} style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicEmoji}>{topic.emoji}</Text>
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
                  Last studied: {topic.stats.lastStudied}
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
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  progressValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  progressLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: "60%",
    backgroundColor: theme.colors.border.light,
  },
})
