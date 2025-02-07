import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native"
import { useAuth } from "../../contexts/auth"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import {
  Play,
  Clock,
  BookOpen,
  Flame,
  Calendar,
  Timer,
  Bookmark,
  Star,
} from "lucide-react-native"
import { router } from "expo-router"
import { theme } from "../../constants/theme"
import { useSavedTopics } from "../../hooks/useSavedTopics"
import { getConsistentColor } from "../../constants/categoryColors"
import { capitalizeText } from "../../utils/utils"

export default function LearningScreen() {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = React.useState(false)
  const { topics: savedTopics, loading: loadingSavedTopics } = useSavedTopics()

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    // TODO: Implement refresh logic
    setRefreshing(false)
  }, [])

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message="Please sign in to view your learning progress" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Learning Journey</Text>
      </View>

      {/* Daily Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.statsCard}>
          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <Flame size={24} color={theme.colors.primary} />
              <Text style={styles.progressValue}>3</Text>
              <Text style={styles.progressLabel}>Day Streak</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.progressItem}>
              <Clock size={24} color={theme.colors.primary} />
              <Text style={styles.progressValue}>45m</Text>
              <Text style={styles.progressLabel}>Today's Time</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.progressItem}>
              <Timer size={24} color={theme.colors.primary} />
              <Text style={styles.progressValue}>2/3</Text>
              <Text style={styles.progressLabel}>Daily Goal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Active Sessions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.savedButton}
              onPress={() => router.push("/saved-topics")}
            >
              <Star size={20} color={theme.colors.primary} />
              <Text style={styles.savedButtonText}>Topics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.savedButton}
              onPress={() => router.push("/saved-videos")}
            >
              <Bookmark size={20} color={theme.colors.primary} />
              <Text style={styles.savedButtonText}>Videos</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.sessionCard}>
          <Text style={styles.emptyStateText}>No active sessions</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push("/")}
          >
            <Play
              size={16}
              color={theme.colors.text.inverse}
              style={styles.buttonIcon}
            />
            <Text style={styles.startButtonText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/stats")}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentActivityList}>
          {/* Empty state for now */}
          <View style={styles.emptyActivityCard}>
            <Calendar size={24} color={theme.colors.text.secondary} />
            <Text style={styles.emptyStateText}>No recent activity</Text>
          </View>
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
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  seeAllButton: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  sessionCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.small,
  },
  statsCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.small,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  startButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  progressLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  progressValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  divider: {
    width: 1,
    height: "80%",
    backgroundColor: theme.colors.border.light,
  },
  recentActivityList: {
    gap: theme.spacing.sm,
  },
  emptyActivityCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    gap: theme.spacing.sm,
  },
  headerButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  savedButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  savedButtonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
})
