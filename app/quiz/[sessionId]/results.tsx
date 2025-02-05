import React, { useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native"
import { Stack, useLocalSearchParams, router } from "expo-router"
import {
  ChevronLeft,
  Trophy,
  Share2,
  RotateCcw,
  Play,
} from "lucide-react-native"
import analytics from "@react-native-firebase/analytics"

export default function QuizResultsScreen() {
  const { sessionId, score } = useLocalSearchParams()
  const currentSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId
  const currentScore = Array.isArray(score) ? score[0] : score
  const totalQuestions = 3 // This should match the total questions in your quiz
  const scoreNum = parseInt(currentScore as string, 10)
  const percentage = (scoreNum / totalQuestions) * 100

  // Log quiz completion when results are shown
  useEffect(() => {
    analytics().logEvent("quiz_complete", {
      session_id: currentSessionId,
      score: scoreNum,
      total_questions: totalQuestions,
      percentage: percentage,
    })
  }, [currentSessionId, scoreNum, totalQuestions, percentage])

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

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share results")
  }

  const handleRetry = () => {
    // Navigate back to quiz
    router.replace({
      pathname: "/quiz/[sessionId]" as const,
      params: { sessionId: currentSessionId },
    })
  }

  const handleContinueLearning = () => {
    // Navigate back to topic
    router.replace({
      pathname: "/topic/[id]" as const,
      params: { id: currentSessionId },
    })
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
          {/* Trophy Icon */}
          <View style={styles.trophyContainer}>
            <Trophy size={64} color={getScoreColor()} />
          </View>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: getScoreColor() }]}>
              {scoreNum}/{totalQuestions}
            </Text>
            <Text style={styles.percentageText}>
              {Math.round(percentage)}% Correct
            </Text>
          </View>

          {/* Feedback */}
          <Text style={styles.feedbackText}>{getFeedback()}</Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share2 size={20} color="#666" />
              <Text style={styles.actionButtonText}>Share Results</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleRetry}>
              <RotateCcw size={20} color="#666" />
              <Text style={styles.actionButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Learning Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace("/progress")}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.continueButtonText}>View Quiz History</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    alignItems: "center",
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
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    gap: 8,
    maxWidth: 160,
  },
  actionButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
