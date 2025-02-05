import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native"
import { Stack, useLocalSearchParams, router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"

export default function QuizScreen() {
  const { sessionId } = useLocalSearchParams()

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

        {/* Placeholder Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Quiz Coming Soon!</Text>
          <Text style={styles.subtitle}>Session ID: {sessionId}</Text>
          <Text style={styles.description}>
            This is where you'll be tested on what you've learned during your
            session. The quiz will be personalized based on the videos you've
            watched.
          </Text>
        </View>
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
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
})
