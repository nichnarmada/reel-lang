import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { useAuth } from "../../contexts/auth"
import { getDocument, FIREBASE_COLLECTIONS } from "../../utils/firebase/config"
import { Quiz, Question, UserResponse } from "../../types/quiz"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import { theme } from "../../constants/theme"

type QuizWithTopic = Quiz & {
  topicName: string
}

export default function QuizDetailScreen() {
  const { quizId } = useLocalSearchParams()
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<QuizWithTopic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false)

  useEffect(() => {
    const loadQuiz = async () => {
      if (!user) return

      try {
        const currentQuizId = Array.isArray(quizId) ? quizId[0] : quizId
        const quizDoc = getDocument(FIREBASE_COLLECTIONS.QUIZZES, currentQuizId)
        const quizSnapshot = await quizDoc.get()

        if (!quizSnapshot.exists) {
          throw new Error("Quiz not found")
        }

        const quizData = quizSnapshot.data() as Quiz
        const sessionDoc = getDocument(
          FIREBASE_COLLECTIONS.SESSIONS,
          quizData.sessionId
        )
        const sessionSnapshot = await sessionDoc.get()

        setQuiz({
          ...quizData,
          topicName: sessionSnapshot.data()?.topicName || "Unknown Topic",
        })
      } catch (err) {
        console.error("Error loading quiz:", err)
        setError("Failed to load quiz details")
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId, user])

  const renderQuestion = (
    question: Question,
    response: UserResponse,
    index: number
  ) => {
    return (
      <View key={question.question} style={styles.questionContainer}>
        <Text style={styles.questionNumber}>Question {index + 1}</Text>
        <Text style={styles.questionText}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <View
              key={option}
              style={[
                styles.optionItem,
                option === response.selectedAnswer &&
                  (response.isCorrect
                    ? styles.correctSelected
                    : styles.incorrectSelected),
                option === question.correctAnswer && styles.correctAnswer,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  option === response.selectedAnswer &&
                    (response.isCorrect
                      ? styles.correctSelectedText
                      : styles.incorrectSelectedText),
                  option === question.correctAnswer && styles.correctAnswerText,
                ]}
              >
                {option}
              </Text>
            </View>
          ))}
        </View>

        {!response.isCorrect && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationLabel}>Explanation:</Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        <Text style={styles.timeSpent}>
          Time spent: {Math.round(response.timeSpent / 1000)}s
        </Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading quiz details...</Text>
      </View>
    )
  }

  if (error || !quiz) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error || "Quiz not found"} />
      </View>
    )
  }

  const correctAnswers = quiz.userResponses.filter(
    (response) => response.isCorrect
  ).length
  const totalQuestions = quiz.questions.length
  const percentage = (correctAnswers / totalQuestions) * 100
  const date = new Date(quiz.metadata.generatedAt.seconds * 1000)

  const questionsToShow = quiz.questions.filter((_, index) =>
    showIncorrectOnly ? !quiz.userResponses[index].isCorrect : true
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Review</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quiz Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.topicName}>{quiz.topicName}</Text>
          <Text style={styles.date}>
            {date.toLocaleDateString()} at {date.toLocaleTimeString()}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>
              {correctAnswers}/{totalQuestions}
            </Text>
            <Text
              style={[
                styles.percentage,
                { color: percentage >= 60 ? "#4CAF50" : "#FF5722" },
              ]}
            >
              {Math.round(percentage)}%
            </Text>
          </View>
        </View>

        {/* Filter Toggle */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowIncorrectOnly(!showIncorrectOnly)}
        >
          <Text style={styles.filterButtonText}>
            {showIncorrectOnly
              ? "Show All Questions"
              : "Show Incorrect Answers Only"}
          </Text>
        </TouchableOpacity>

        {/* Questions */}
        <View style={styles.questionsContainer}>
          {questionsToShow.map((question, index) =>
            renderQuestion(question, quiz.userResponses[index], index)
          )}
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
  summaryContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  topicName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  percentage: {
    fontSize: 18,
    fontWeight: "600",
  },
  filterButton: {
    margin: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    alignItems: "center",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#8a2be2",
    fontWeight: "500",
  },
  questionsContainer: {
    padding: theme.spacing.md,
  },
  questionContainer: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  questionNumber: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  questionText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionItem: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  optionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
  },
  correctSelected: {
    backgroundColor: `${theme.colors.status.success}15`,
    borderColor: theme.colors.status.success,
  },
  incorrectSelected: {
    backgroundColor: `${theme.colors.status.error}15`,
    borderColor: theme.colors.status.error,
  },
  correctAnswer: {
    backgroundColor: `${theme.colors.status.success}15`,
    borderColor: theme.colors.status.success,
  },
  correctSelectedText: {
    color: theme.colors.status.success,
    fontWeight: theme.typography.weights.medium,
  },
  incorrectSelectedText: {
    color: theme.colors.status.error,
    fontWeight: theme.typography.weights.medium,
  },
  correctAnswerText: {
    color: theme.colors.status.success,
    fontWeight: theme.typography.weights.medium,
  },
  explanationContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
  },
  explanationLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  explanationText: {
    fontSize: 14,
    color: "#333",
  },
  timeSpent: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
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
