import analytics from "@react-native-firebase/analytics"
import { Stack, router } from "expo-router"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from "react-native"

import { ErrorMessage } from "../../components/ErrorMessage"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { useAuth } from "../../contexts/auth"
import { QuizSession } from "../../types/quiz"
import {
  getCollection,
  FIREBASE_COLLECTIONS,
} from "../../utils/firebase/config"

export default function QuizHistoryScreen() {
  const { user } = useAuth()
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQuizzes = async () => {
    if (!user) return

    try {
      const quizSessionsCollection = getCollection(
        FIREBASE_COLLECTIONS.QUIZ_SESSIONS
      )
      const sessionsSnapshot = await quizSessionsCollection
        .where("userId", "==", user.uid)
        .where("status", "==", "completed")
        .orderBy("completedAt", "desc")
        .get()

      const sessionData = sessionsSnapshot.docs.map(
        (doc) => doc.data() as QuizSession
      )

      setQuizSessions(sessionData)

      // Log analytics event
      analytics().logEvent("quiz_history_view", {
        quiz_count: sessionData.length,
      })
    } catch (err) {
      console.error("Error loading quizzes:", err)
      setError("Failed to load quiz history")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadQuizzes()
  }, [user])

  const onRefresh = () => {
    setRefreshing(true)
    loadQuizzes()
  }

  const handleQuizSelect = (quizSession: QuizSession) => {
    analytics().logEvent("quiz_review_open", {
      quiz_id: quizSession.id,
      from_screen: "history",
    })

    router.push({
      pathname: "/quiz-history/[quizId]" as const,
      params: {
        quizId: quizSession.id,
        sessionId: quizSession.sessionId,
      },
    })
  }

  const renderQuizItem = ({ item }: { item: QuizSession }) => {
    const correctAnswers = item.userResponses.filter(
      (response) => response.isCorrect
    ).length
    const totalQuestions = item.userResponses.length
    const percentage = (correctAnswers / totalQuestions) * 100
    const date = item.completedAt
      ? new Date(item.completedAt.seconds * 1000)
      : new Date()

    return (
      <TouchableOpacity
        style={styles.quizItem}
        onPress={() => handleQuizSelect(item)}
      >
        <View style={styles.quizInfo}>
          <Text style={styles.topicName}>
            {item.topicEmoji || "📚"} {item.topicName}
          </Text>
          <Text style={styles.date}>
            {date.toLocaleDateString()} at {date.toLocaleTimeString()}
          </Text>
        </View>
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
        <ChevronRight size={20} color="#666" />
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Quiz History</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>Loading quiz history...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <ErrorMessage message={error} />
          </View>
        ) : quizSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No quizzes completed yet</Text>
            <Text style={styles.emptySubtext}>
              Complete a learning session to take a quiz
            </Text>
          </View>
        ) : (
          <FlatList
            data={quizSessions}
            renderItem={renderQuizItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
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
  listContainer: {
    padding: 16,
  },
  quizItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  quizInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  scoreContainer: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  score: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  percentage: {
    fontSize: 14,
    fontWeight: "500",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
})
