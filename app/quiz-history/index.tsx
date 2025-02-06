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
import { Stack, router } from "expo-router"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { useAuth } from "../../contexts/auth"
import {
  getCollection,
  getDocument,
  FIREBASE_COLLECTIONS,
} from "../../utils/firebase/config"
import { Quiz } from "../../types/quiz"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import analytics from "@react-native-firebase/analytics"

type QuizHistoryItem = Quiz & {
  topicName: string // We'll denormalize this for convenience
}

export default function QuizHistoryScreen() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<QuizHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQuizzes = async () => {
    if (!user) return

    try {
      const quizzesCollection = getCollection(FIREBASE_COLLECTIONS.QUIZZES)
      const quizSnapshot = await quizzesCollection
        .where("userId", "==", user.uid)
        .orderBy("metadata.generatedAt", "desc")
        .get()

      const quizData = await Promise.all(
        quizSnapshot.docs.map(async (doc) => {
          const quiz = doc.data() as Quiz
          // Fetch topic name from session
          const sessionDoc = getDocument(
            FIREBASE_COLLECTIONS.SESSIONS,
            quiz.sessionId
          )
          const sessionSnapshot = await sessionDoc.get()

          return {
            ...quiz,
            topicName: sessionSnapshot.data()?.topicName || "Unknown Topic",
          } as QuizHistoryItem
        })
      )

      setQuizzes(quizData)

      // Log analytics event
      analytics().logEvent("quiz_history_view", {
        quiz_count: quizData.length,
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

  const handleQuizSelect = (quizId: string) => {
    analytics().logEvent("quiz_review_open", {
      quiz_id: quizId,
      from_screen: "history",
    })

    router.push({
      pathname: "/quiz-history/[quizId]" as const,
      params: { quizId },
    })
  }

  const renderQuizItem = ({ item }: { item: QuizHistoryItem }) => {
    const correctAnswers = item.userResponses.filter(
      (response) => response.isCorrect
    ).length
    const totalQuestions = item.questions.length
    const percentage = (correctAnswers / totalQuestions) * 100
    const date = new Date(item.metadata.generatedAt.seconds * 1000)

    return (
      <TouchableOpacity
        style={styles.quizItem}
        onPress={() => handleQuizSelect(item.id)}
      >
        <View style={styles.quizInfo}>
          <Text style={styles.topicName}>{item.topicName}</Text>
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
        ) : quizzes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No quizzes completed yet</Text>
            <Text style={styles.emptySubtext}>
              Complete a learning session to take a quiz
            </Text>
          </View>
        ) : (
          <FlatList
            data={quizzes}
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
