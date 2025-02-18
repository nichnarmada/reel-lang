import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native"

import { ErrorMessage } from "../components/ErrorMessage"
import { theme } from "../constants/theme"
import { useAuth } from "../contexts/auth"
import { useUserPreferences } from "../hooks/useUserPreferences"

import { allCategories } from "@/constants/topics"

const minimumCategories = 3

export default function OnboardingScreen() {
  const { user, hasCompletedOnboarding, setOnboardingComplete } = useAuth()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const { saveOnboardingSelections, loading, error } = useUserPreferences(
    user?.uid || ""
  )

  // Redirect if already completed onboarding
  useEffect(() => {
    if (hasCompletedOnboarding) {
      router.replace("/")
    }
  }, [hasCompletedOnboarding])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      }
      return [...prev, categoryId]
    })
  }

  const handleContinue = async () => {
    if (!user || selectedCategories.length < minimumCategories) return

    try {
      await saveOnboardingSelections(selectedCategories)
      await setOnboardingComplete()
      router.replace("/")
    } catch (err) {
      console.error("[Onboarding] Error saving preferences:", err)
    }
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Please sign in to continue</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.mainContent}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Welcome to DiscoverAI!</Text>
            <Text style={styles.headerSubtitle}>
              Select topics you're interested in learning about. Choose at least
              {minimumCategories} to get started.
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <ErrorMessage message={error} />
            </View>
          )}

          {/* Categories Grid */}
          <View style={styles.categoriesContainer}>
            {allCategories.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: selectedCategories.includes(topic.id)
                      ? topic.color
                      : topic.color + "15",
                  },
                ]}
                onPress={() => handleCategorySelect(topic.id)}
                disabled={loading}
              >
                <topic.icon
                  size={24}
                  color={
                    selectedCategories.includes(topic.id) ? "#fff" : topic.color
                  }
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: selectedCategories.includes(topic.id)
                        ? "#fff"
                        : topic.color,
                    },
                  ]}
                >
                  {topic.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Continue Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              opacity:
                selectedCategories.length >= minimumCategories && !loading
                  ? 1
                  : 0.5,
            },
          ]}
          onPress={handleContinue}
          disabled={selectedCategories.length < minimumCategories || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue ({selectedCategories.length}/{minimumCategories})
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flexGrow: 1,
    minHeight: "100%",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 100 : 60,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1a1a1a",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 80 : 90,
    maxWidth: 600,
    alignSelf: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    marginBottom: 0,
  },
  categoryText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
    minWidth: 200,
    alignItems: "center",
  },
  continueButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  messageText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  errorContainer: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : theme.spacing.xl,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.medium,
  },
})
