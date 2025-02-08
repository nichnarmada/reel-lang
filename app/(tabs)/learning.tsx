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
import { ErrorMessage } from "../../components/ErrorMessage"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import {
  Play,
  Clock,
  BookOpen,
  Flame,
  Calendar,
  Timer,
  Bookmark,
  Star,
  Pause,
  RotateCw,
} from "lucide-react-native"
import { router } from "expo-router"
import { theme } from "../../constants/theme"
import { useSavedTopics } from "../../hooks/useSavedTopics"
import { useLearningSession } from "../../hooks/useLearningSession"
import { format } from "date-fns"
import { LearningSession } from "../../types/session"

export default function LearningScreen() {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = React.useState(false)
  const {
    sessions,
    loading: loadingSessions,
    error: sessionsError,
    resumeSession,
    fetchSessions,
  } = useLearningSession(user?.uid || "")

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchSessions()
    } finally {
      setRefreshing(false)
    }
  }, [fetchSessions])

  const handleResumeSession = async (sessionId: string) => {
    try {
      await resumeSession(sessionId)
      // Navigate to the topic with session data
      const session = sessions.find((s) => s.id === sessionId)
      if (session) {
        router.push({
          pathname: "/topic/[id]/reels" as const,
          params: {
            id: session.topicId,
            topicId: session.topicId,
            topicName: session.topicName,
            duration: session.duration?.toString() || "5",
            sessionId: session.id,
            lastVideoId: session.progress?.lastVideoId,
            lastVideoTimestamp:
              session.progress?.lastVideoTimestamp?.toString(),
          },
        })
      }
    } catch (error) {
      console.error("Error resuming session:", error)
    }
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message="Please sign in to view your learning progress" />
      </View>
    )
  }

  if (loadingSessions) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>
          Loading your learning sessions...
        </Text>
      </View>
    )
  }

  if (sessionsError) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={sessionsError} />
      </View>
    )
  }

  const activeSessions = sessions.filter((s) => s.status === "active")
  const pausedSessions = sessions.filter((s) => s.status === "paused")

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
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing || loadingSessions}
        >
          <RotateCw
            size={20}
            color={theme.colors.primary}
            style={[
              styles.refreshIcon,
              (refreshing || loadingSessions) && styles.rotating,
            ]}
          />
        </TouchableOpacity>
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

        {sessions.length > 0 ? (
          <View style={styles.sessionsList}>
            {activeSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    {session.topicEmoji && (
                      <Text style={styles.topicEmoji}>
                        {session.topicEmoji}
                      </Text>
                    )}
                    <Text style={styles.topicName}>{session.topicName}</Text>
                  </View>
                  <View style={styles.sessionBadge}>
                    <Timer size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.sessionBadgeText}>
                      {session.duration
                        ? `${session.duration}min`
                        : "No time limit"}
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionStats}>
                  <View style={styles.statItem}>
                    <Clock size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.statText}>
                      {session.progress?.timeSpent ?? 0}min spent
                    </Text>
                  </View>
                  <Text style={styles.statDivider}>•</Text>
                  <View style={styles.statItem}>
                    <Play size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.statText}>
                      {session.progress?.videosWatched ?? 0} videos
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={() => handleResumeSession(session.id)}
                >
                  <Play size={16} color={theme.colors.primary} />
                  <Text style={styles.resumeButtonText}>Continue Learning</Text>
                </TouchableOpacity>
              </View>
            ))}

            {pausedSessions.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Paused Sessions</Text>
                {pausedSessions.map((session) => (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionInfo}>
                        {session.topicEmoji && (
                          <Text style={styles.topicEmoji}>
                            {session.topicEmoji}
                          </Text>
                        )}
                        <Text style={styles.topicName}>
                          {session.topicName}
                        </Text>
                      </View>
                      <View style={styles.sessionBadge}>
                        <Timer size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.sessionBadgeText}>
                          {session.duration
                            ? `${session.duration}min`
                            : "No time limit"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionStats}>
                      <View style={styles.statItem}>
                        <Clock size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.statText}>
                          {session.progress?.timeSpent ?? 0}min spent
                        </Text>
                      </View>
                      <Text style={styles.statDivider}>•</Text>
                      <View style={styles.statItem}>
                        <Play size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.statText}>
                          {session.progress?.videosWatched ?? 0} videos
                        </Text>
                      </View>
                      <Text style={styles.statDivider}>•</Text>
                      <View style={styles.statItem}>
                        <Pause size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.statText}>
                          Paused {format(session.pausedAt!, "MMM d")}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.resumeButton}
                      onPress={() => handleResumeSession(session.id)}
                    >
                      <Play size={16} color={theme.colors.primary} />
                      <Text style={styles.resumeButtonText}>
                        Resume Learning
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        ) : (
          <View style={styles.emptySessionContainer}>
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
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  subsectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  seeAllButton: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  emptySessionContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
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
  sessionsList: {
    gap: theme.spacing.sm,
  },
  sessionCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.small,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  sessionInfo: {
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
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  sessionBadgeText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  sessionStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  statDivider: {
    marginHorizontal: theme.spacing.sm,
    color: theme.colors.text.secondary,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
  },
  resumeButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
  },
  refreshIcon: {
    opacity: 0.8,
  },
  rotating: {
    opacity: 0.5,
  },
})
