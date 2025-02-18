import { router } from "expo-router"
import {
  Play,
  Calendar,
  Timer,
  Bookmark,
  Star,
  Pause,
  History,
  Brain,
  CheckCircle2,
} from "lucide-react-native"
import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native"

import { ErrorMessage } from "../../components/ErrorMessage"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { MenuDrawer } from "../../components/menu-drawer"
import { theme } from "../../constants/theme"
import { useAuth } from "../../contexts/auth"
import { useLearningSession } from "../../hooks/useLearningSession"
import { useUserQuizSessions } from "../../hooks/useQuizSession"
import { startPendingQuiz, getQuizContent } from "../../services/quiz/quizFlow"
import { Quiz } from "../../types/quiz"

export default function LearningScreen() {
  const { user } = useAuth()
  const [quizContents, setQuizContents] = useState<Record<string, Quiz>>({})
  const {
    sessions,
    loading: loadingSessions,
    error: sessionsError,
    resumeSession,
  } = useLearningSession(user?.uid || "")
  const {
    sessions: quizSessions,
    loading: loadingQuizzes,
    error: quizError,
  } = useUserQuizSessions(user?.uid)

  useEffect(() => {
    // Load quiz content for each quiz session
    const loadQuizContents = async () => {
      const contents: Record<string, Quiz> = {}
      for (const quiz of quizSessions) {
        try {
          const content = await getQuizContent(quiz.sessionId)
          if (content) {
            contents[quiz.id] = content
          }
        } catch (error) {
          console.error("Error loading quiz content:", error)
        }
      }
      setQuizContents(contents)
    }

    if (quizSessions.length > 0) {
      loadQuizContents()
    }
  }, [quizSessions])

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
            // Use remaining time from progress if available, otherwise use original duration
            duration: session.progress?.remainingTimeSeconds
              ? (session.progress.remainingTimeSeconds / 60).toString()
              : session.duration?.toString() || "5",
            sessionId: session.id,
            isResumed: "true", // Flag to indicate this is a resumed session
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

  const handleStartQuiz = async (quizSessionId: string) => {
    try {
      // Start the quiz first
      await startPendingQuiz(quizSessionId)

      // Then navigate to quiz screen
      router.push({
        pathname: "/quiz/[sessionId]" as const,
        params: { sessionId: quizSessionId },
      })
    } catch (error) {
      console.error("Error starting quiz:", error)
      Alert.alert("Error", "Failed to start quiz. Please try again.")
    }
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message="Please sign in to view your learning progress" />
      </View>
    )
  }

  if (loadingSessions || loadingQuizzes) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>
          Loading your learning sessions...
        </Text>
      </View>
    )
  }

  if (sessionsError || quizError) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage
          message={sessionsError || quizError || "An error occurred"}
        />
      </View>
    )
  }

  const activeSessions = sessions.filter((s) => s.status === "active")
  const pausedSessions = sessions.filter((s) => s.status === "paused")
  const pendingQuizzes = quizSessions.filter((q) => q.status === "pending")
  const inProgressQuizzes = quizSessions.filter(
    (q) => q.status === "in_progress"
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Learning Journey</Text>
          <MenuDrawer
            items={[
              {
                id: "quiz-history",
                label: "Quiz History",
                icon: History,
                onPress: () => router.push("/quiz-history"),
              },
              {
                id: "favorite-topics",
                label: "Favorite Topics",
                icon: Star,
                onPress: () => router.push("/saved-topics"),
              },
              {
                id: "saved-videos",
                label: "Saved Videos",
                icon: Bookmark,
                onPress: () => router.push("/saved-videos"),
              },
            ]}
          />
        </View>
      </View>

      {/* Quizzes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>Your Quizzes</Text>
          </View>
        </View>

        {pendingQuizzes.length > 0 || inProgressQuizzes.length > 0 ? (
          <View style={styles.sessionsList}>
            {inProgressQuizzes.map((quiz) => (
              <View key={quiz.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.topicName}>
                      {quiz.topicEmoji || "📚"} {quiz.topicName}
                    </Text>
                    <View style={styles.progressInfo}>
                      <View style={styles.progressBadge}>
                        <Brain size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.progressText}>
                          Question {quiz.currentQuestionIndex + 1} of{" "}
                          {quizContents[quiz.id]?.questions?.length || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.sessionBadge}>
                    <Timer size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.sessionBadgeText}>In Progress</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={() => handleStartQuiz(quiz.id)}
                >
                  <Play size={16} color={theme.colors.primary} />
                  <Text style={styles.resumeButtonText}>Continue Quiz</Text>
                </TouchableOpacity>
              </View>
            ))}

            {pendingQuizzes.map((quiz) => (
              <View key={quiz.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.topicName}>
                      {quiz.topicEmoji || "📚"} {quiz.topicName}
                    </Text>
                    <View style={styles.progressInfo}>
                      <View style={styles.progressBadge}>
                        <CheckCircle2
                          size={14}
                          color={theme.colors.text.secondary}
                        />
                        <Text style={styles.progressText}>
                          {quizContents[quiz.id]?.questions?.length || 0}{" "}
                          questions
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.sessionBadge}>
                    <Timer size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.sessionBadgeText}>Ready to Start</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={() => handleStartQuiz(quiz.id)}
                >
                  <Play size={16} color={theme.colors.primary} />
                  <Text style={styles.resumeButtonText}>Start Quiz</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySessionContainer}>
            <CheckCircle2 size={24} color={theme.colors.text.secondary} />
            <Text style={styles.emptyStateText}>
              All caught up! No pending quizzes.
            </Text>
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

      {/* Active Sessions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
          </View>
        </View>

        {sessions.length > 0 ? (
          <View style={styles.sessionsList}>
            {activeSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
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
                        <Text style={styles.topicName}>
                          {session.topicName}
                        </Text>
                        {session.progress && (
                          <View style={styles.progressInfo}>
                            <View style={styles.progressBadge}>
                              <Timer
                                size={14}
                                color={theme.colors.text.secondary}
                              />
                              <Text style={styles.progressText}>
                                {Math.floor(
                                  session.progress.remainingTimeSeconds / 60
                                )}
                                m{" "}
                                {Math.floor(
                                  session.progress.remainingTimeSeconds % 60
                                )}
                                s left
                              </Text>
                            </View>
                            {session.progress.videosWatched > 0 && (
                              <View style={styles.progressBadge}>
                                <Play
                                  size={14}
                                  color={theme.colors.text.secondary}
                                />
                                <Text style={styles.progressText}>
                                  {session.progress.videosWatched} videos
                                  watched
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <View style={styles.sessionBadge}>
                        <Pause size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.sessionBadgeText}>Paused</Text>
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    flex: 1,
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
    flex: 1,
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
  progressInfo: {
    flexDirection: "column",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: "flex-start",
  },
  progressText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
})
