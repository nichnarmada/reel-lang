import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from "react-native"
import { Stack, useLocalSearchParams, router } from "expo-router"
import {
  ChevronLeft,
  Trophy,
  RotateCcw,
  Play,
  BookPlus,
} from "lucide-react-native"
import {
  getDocument,
  FIREBASE_COLLECTIONS,
} from "../../../utils/firebase/config"
import { Quiz } from "../../../types/quiz"
import { LoadingSpinner } from "../../../components/LoadingSpinner"
import { ErrorMessage } from "../../../components/ErrorMessage"
import { LoadingOverlay } from "../../../components/LoadingOverlay"
import { startQuizAfterSession } from "../../../services/quiz/quizFlow"
import { Session } from "../../../types/session"
import { theme } from "../../../constants/theme"

export default function QuizResultsScreen() {
  const { sessionId, score, quizId, totalQuestions } = useLocalSearchParams()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingQuiz, setGeneratingQuiz] = useState({
    show: false,
    message: "",
    step: 0,
    totalSteps: 3,
  })

  const currentSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId
  const currentScore = Array.isArray(score) ? score[0] : score
  const total = Array.isArray(totalQuestions)
    ? totalQuestions[0]
    : totalQuestions
  const scoreNum = parseInt(currentScore as string, 10)
  const totalNum = parseInt(total as string, 10)
  const percentage = (scoreNum / totalNum) * 100

  useEffect(() => {
    const loadQuizDetails = async () => {
      try {
        const currentQuizId = Array.isArray(quizId) ? quizId[0] : quizId
        if (!currentQuizId) return

        const quizDoc = getDocument(FIREBASE_COLLECTIONS.QUIZZES, currentQuizId)
        const quizSnapshot = await quizDoc.get()

        if (!quizSnapshot.exists) {
          throw new Error("Quiz not found")
        }

        setQuiz(quizSnapshot.data() as Quiz)
      } catch (err) {
        console.error("Error loading quiz details:", err)
        setError("Failed to load quiz details")
      } finally {
        setLoading(false)
      }
    }

    loadQuizDetails()
  }, [quizId])

  const getFeedback = () => {
    if (percentage >= 80) return "Excellent! You've mastered this topic!"
    if (percentage >= 60) return "Good job! Keep practicing to improve further."
    return "Keep learning! Practice makes perfect."
  }

  const getScoreColor = () => {
    if (percentage >= 80) return "#4CAF50"
    if (percentage >= 60) return "#FFC107"
    return "#FF5722"
  }

  const handleNewQuiz = async () => {
    try {
      // Start loading with first step
      setGeneratingQuiz({
        show: true,
        message: "Analyzing topic...",
        step: 1,
        totalSteps: 3,
      })

      // Get the session data
      const currentSessionId = Array.isArray(sessionId)
        ? sessionId[0]
        : sessionId
      const sessionDoc = getDocument(
        FIREBASE_COLLECTIONS.SESSIONS,
        currentSessionId
      )
      const sessionSnapshot = await sessionDoc.get()

      if (!sessionSnapshot.exists) {
        throw new Error("Session not found")
      }

      const session = {
        ...sessionSnapshot.data(),
        id: currentSessionId,
      } as Session

      // Simulate a small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update to second step
      setGeneratingQuiz((prev) => ({
        ...prev,
        message: "Generating new questions...",
        step: 2,
      }))

      // Generate the quiz
      await startQuizAfterSession(session)

      // Final step before navigation
      setGeneratingQuiz((prev) => ({
        ...prev,
        message: "Preparing your quiz experience...",
        step: 3,
      }))

      // Small delay to show the final step
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error("Error generating new quiz:", error)
      Alert.alert("Error", "Failed to generate new quiz. Please try again.")
    } finally {
      setGeneratingQuiz((prev) => ({ ...prev, show: false }))
    }
  }

  const handleRetry = () => {
    // Navigate back to quiz
    router.replace({
      pathname: "/quiz/[sessionId]" as const,
      params: {
        sessionId: currentSessionId,
        quizId: Array.isArray(quizId) ? quizId[0] : quizId,
      },
    })
  }

  const handleContinueLearning = () => {
    // Navigate to quiz review
    router.replace({
      pathname: "/quiz-history/[quizId]" as const,
      params: { quizId: Array.isArray(quizId) ? quizId[0] : quizId },
    })
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Results</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Topic Name */}
          {quiz && (
            <Text style={styles.topicName}>{quiz.metadata.topics[0]}</Text>
          )}

          {/* Trophy Icon */}
          <View style={styles.trophyContainer}>
            <Trophy size={64} color={getScoreColor()} />
          </View>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: getScoreColor() }]}>
              {scoreNum}/{totalNum}
            </Text>
            <Text style={styles.percentageText}>
              {Math.round(percentage)}% Correct
            </Text>
          </View>

          {/* Feedback */}
          <Text style={styles.feedbackText}>{getFeedback()}</Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.errorButton]}
              onPress={handleRetry}
            >
              <RotateCcw size={20} color={theme.colors.status.error} />
              <Text style={[styles.actionButtonText, styles.errorButtonText]}>
                Try Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              onPress={handleNewQuiz}
            >
              <BookPlus size={20} color={theme.colors.status.success} />
              <Text style={[styles.actionButtonText, styles.successButtonText]}>
                New Quiz
              </Text>
            </TouchableOpacity>
          </View>

          {/* Continue Learning Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueLearning}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.continueButtonText}>Review Answers</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Loading Overlay */}
        {generatingQuiz.show && (
          <LoadingOverlay
            variant="overlay"
            message={`${generatingQuiz.message} (${generatingQuiz.step}/${generatingQuiz.totalSteps})`}
            size="large"
            isTransparent={false}
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingTop: Platform.OS === "ios" ? 60 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 8,
    color: "#000",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    alignItems: "center",
  },
  topicName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  trophyContainer: {
    marginVertical: 32,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 20,
    color: "#666",
  },
  feedbackText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    maxWidth: 160,
    borderWidth: 1,
    height: 56,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  successButton: {
    backgroundColor: `${theme.colors.status.success}15`,
    borderColor: theme.colors.status.success,
  },
  successButtonText: {
    color: theme.colors.status.success,
  },
  errorButton: {
    backgroundColor: `${theme.colors.status.error}15`,
    borderColor: theme.colors.status.error,
  },
  errorButtonText: {
    color: theme.colors.status.error,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8a2be2",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: "100%",
    height: 56,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
})
