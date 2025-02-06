import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native"
import { Stack, useLocalSearchParams, router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { LoadingSpinner } from "../../../components/LoadingSpinner"
import { ErrorMessage } from "../../../components/ErrorMessage"
import {
  getDocument,
  FIREBASE_COLLECTIONS,
} from "../../../utils/firebase/config"
import { Question } from "../../../types/quiz"

export default function QuizScreen() {
  const { sessionId, quizId } = useLocalSearchParams()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({})
  const [startTimes, setStartTimes] = useState<Record<string, number>>({})

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const currentQuizId = Array.isArray(quizId) ? quizId[0] : quizId
        const quizDoc = getDocument(FIREBASE_COLLECTIONS.QUIZZES, currentQuizId)
        const quizSnapshot = await quizDoc.get()

        if (!quizSnapshot.exists) {
          throw new Error("Quiz not found")
        }

        const quizData = quizSnapshot.data()
        setQuestions(quizData?.questions || [])

        // Set start time for first question
        setStartTimes({
          [quizData?.questions[0]?.question]: Date.now(),
        })
      } catch (err) {
        console.error("Error loading quiz:", err)
        setError("Failed to load quiz questions")
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId])

  const currentQuestion = questions[currentQuestionIndex]
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0

  const handleSelectOption = async (
    questionId: string,
    selectedAnswer: string
  ) => {
    const timeSpent =
      Date.now() - (startTimes[currentQuestion.question] || Date.now())

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer,
    }))

    // If there are more questions, advance and set new start time
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setStartTimes((prev) => ({
        ...prev,
        [questions[currentQuestionIndex + 1].question]: Date.now(),
      }))
    } else {
      // Quiz completed, prepare responses
      const userResponses = questions.map((question) => ({
        questionId: question.question,
        selectedAnswer: selectedAnswers[question.question] || selectedAnswer,
        isCorrect:
          (selectedAnswers[question.question] || selectedAnswer) ===
          question.correctAnswer,
        timeSpent: startTimes[question.question]
          ? Date.now() - startTimes[question.question]
          : 0,
      }))

      // Calculate final score
      const correctAnswers = userResponses.filter(
        (response) => response.isCorrect
      ).length

      try {
        // Update quiz document with responses
        const currentQuizId = Array.isArray(quizId) ? quizId[0] : quizId
        const quizDoc = getDocument(FIREBASE_COLLECTIONS.QUIZZES, currentQuizId)
        await quizDoc.update({
          userResponses,
        })

        // Navigate to results
        const currentSessionId = Array.isArray(sessionId)
          ? sessionId[0]
          : sessionId
        router.replace({
          pathname: "/quiz/[sessionId]/results" as const,
          params: {
            sessionId: currentSessionId,
            score: correctAnswers.toString(),
            quizId: currentQuizId,
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
          <Text style={styles.headerTitle}>Session Quiz</Text>
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
                  selectedAnswers[currentQuestion.question] === option &&
                    styles.selectedOption,
                ]}
                onPress={() =>
                  handleSelectOption(currentQuestion.question, option)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedAnswers[currentQuestion.question] === option &&
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
