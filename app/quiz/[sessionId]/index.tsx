import { Stack, useLocalSearchParams, router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native"

import { ErrorMessage } from "../../../components/ErrorMessage"
import { LoadingSpinner } from "../../../components/LoadingSpinner"
import { Question, Quiz, QuizSession } from "../../../types/quiz"
import {
  getSessionSubcollectionDoc,
  FIREBASE_SUBCOLLECTIONS,
  getSessionQuizDoc,
  getQuizSessionDoc,
} from "../../../utils/firebase/config"
import { getQuizSession } from "../../../services/quiz/quizFlow"

export default function QuizScreen() {
  const params = useLocalSearchParams()
  const { sessionId, quizId } = params

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({})
  const [startTimes, setStartTimes] = useState<Record<string, number>>({})
  const [quizData, setQuizData] = useState<Quiz | null>(null)
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const currentSessionId = Array.isArray(sessionId)
          ? sessionId[0]
          : sessionId

        // First get the quiz session for state/progress
        const quizSession = await getQuizSession(currentSessionId)
        if (!quizSession) {
          throw new Error("Quiz session not found")
        }
        setQuizSession(quizSession)

        // Then get the actual quiz content from session's subcollection
        const quizRef = getSessionQuizDoc(quizSession.sessionId)
        const quizSnapshot = await quizRef.get()
        if (!quizSnapshot.exists) {
          throw new Error("Quiz not found")
        }

        const quiz = quizSnapshot.data() as Quiz
        setQuizData(quiz)
        setQuestions(quiz.questions || [])

        // Set start time for first question using question ID
        if (quiz.questions && quiz.questions.length > 0) {
          setStartTimes({
            [quiz.questions[0].id]: Date.now(),
          })
        }

        // Set current question index from session if it exists
        if (quizSession.currentQuestionIndex > 0) {
          setCurrentQuestionIndex(quizSession.currentQuestionIndex)
        }
      } catch (err) {
        console.error("Error loading quiz:", err)
        setError("Failed to load quiz questions")
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId, sessionId])

  const currentQuestion = questions[currentQuestionIndex]
  const progress =
    questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0

  const handleSelectOption = async (
    questionId: string,
    selectedAnswer: string
  ) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer,
    }))

    // If there are more questions, advance and set new start time
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setStartTimes((prev) => ({
        ...prev,
        [questions[nextIndex].id]: Date.now(),
      }))

      // Update quiz session with new question index
      const currentSessionId = Array.isArray(sessionId)
        ? sessionId[0]
        : sessionId
      const quizSessionRef = getQuizSessionDoc(currentSessionId)
      await quizSessionRef.update({
        currentQuestionIndex: nextIndex,
        lastUpdatedAt: new Date(),
      })
    } else {
      // Quiz completed, prepare responses
      const userResponses = questions.map((question) => ({
        questionId: question.id,
        selectedAnswer: selectedAnswers[question.id] || selectedAnswer,
        isCorrect:
          (selectedAnswers[question.id] || selectedAnswer) ===
          question.correctAnswer,
        timeSpent: startTimes[question.id]
          ? Date.now() - startTimes[question.id]
          : 0,
      }))

      // Calculate final score
      const correctAnswers = userResponses.filter(
        (response) => response.isCorrect
      ).length

      try {
        // Update quiz session with completion status and responses
        const currentSessionId = Array.isArray(sessionId)
          ? sessionId[0]
          : sessionId
        const quizSessionRef = getQuizSessionDoc(currentSessionId)
        await quizSessionRef.update({
          status: "completed",
          completedAt: new Date(),
          lastUpdatedAt: new Date(),
          userResponses,
          currentQuestionIndex: questions.length - 1,
        })

        // Navigate to results
        router.replace({
          pathname: "/quiz/[sessionId]/results" as const,
          params: {
            sessionId: currentSessionId,
            score: correctAnswers.toString(),
            totalQuestions: questions.length.toString(),
          },
        })
      } catch (err) {
        console.error("Error saving quiz responses:", err)
        setError("Failed to save your answers. Please try again.")
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    )
  }

  if (error || !currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error || "No questions available"} />
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
          <Text style={styles.headerTitle}>
            {quizSession?.topicEmoji || "📚"}{" "}
            {quizSession?.topicName || "Session"} Quiz
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Question Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.question}>{currentQuestion.question}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswers[currentQuestion.id] === option &&
                    styles.selectedOption,
                ]}
                onPress={() => handleSelectOption(currentQuestion.id, option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedAnswers[currentQuestion.id] === option &&
                      styles.selectedOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
  progressContainer: {
    height: 4,
    backgroundColor: "#f0f0f0",
    width: "100%",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#8a2be2",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  questionNumber: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  question: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 32,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  selectedOption: {
    backgroundColor: "#8a2be215",
    borderColor: "#8a2be2",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "#8a2be2",
    fontWeight: "500",
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
