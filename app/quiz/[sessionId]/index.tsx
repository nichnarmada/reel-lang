import React, { useState } from "react"
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
import { ChevronLeft } from "lucide-react-native"

// Placeholder quiz data with correct answers
const SAMPLE_QUESTIONS = [
  {
    id: "1",
    question: "What is the main concept covered in the first video?",
    options: [
      "Basic fundamentals",
      "Advanced techniques",
      "Historical context",
      "Modern applications",
    ],
    correctAnswer: 0, // Index of correct answer
  },
  {
    id: "2",
    question: "Which technique was demonstrated in the second video?",
    options: [
      "Progressive learning",
      "Spaced repetition",
      "Active recall",
      "Mind mapping",
    ],
    correctAnswer: 2, // Index of correct answer
  },
  {
    id: "3",
    question: "What was the key takeaway from the third video?",
    options: [
      "Practice makes perfect",
      "Learning is continuous",
      "Time management",
      "Goal setting",
    ],
    correctAnswer: 1, // Index of correct answer
  },
]

export default function QuizScreen() {
  const { sessionId } = useLocalSearchParams()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({})

  const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / SAMPLE_QUESTIONS.length) * 100

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))

    // Automatically advance to next question
    if (currentQuestionIndex < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Calculate actual score based on correct answers
      const correctAnswers = Object.entries(selectedAnswers).reduce(
        (count, [qId, selectedOption]) => {
          const question = SAMPLE_QUESTIONS.find((q) => q.id === qId)
          return count + (question?.correctAnswer === selectedOption ? 1 : 0)
        },
        0
      )

      // Add the last answer to the score if it's correct
      const finalScore =
        correctAnswers +
        (SAMPLE_QUESTIONS[currentQuestionIndex].correctAnswer === optionIndex
          ? 1
          : 0)

      // Ensure sessionId is a string
      const currentSessionId = Array.isArray(sessionId)
        ? sessionId[0]
        : sessionId

      // Navigate to results page
      router.replace({
        pathname: "/quiz/[sessionId]/results" as const,
        params: {
          sessionId: currentSessionId,
          score: finalScore.toString(),
        },
      })
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
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
            Question {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}
          </Text>
          <Text style={styles.question}>{currentQuestion.question}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswers[currentQuestion.id] === index &&
                    styles.selectedOption,
                ]}
                onPress={() => handleSelectOption(currentQuestion.id, index)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedAnswers[currentQuestion.id] === index &&
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
})
