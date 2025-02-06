import { useState, useCallback } from "react"
import firestore from "@react-native-firebase/firestore"
import { FIREBASE_COLLECTIONS } from "../utils/firebase/config"
import { UserPreferences } from "../types/user"

export const useUserPreferences = (userId: string) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const savePreferences = useCallback(
    async (preferences: Partial<UserPreferences>) => {
      setLoading(true)
      setError(null)
      try {
        const userPrefsRef = firestore()
          .collection(FIREBASE_COLLECTIONS.USERS)
          .doc(userId)
          .collection("preferences")
          .doc("default")

        // Get existing preferences first
        const existingPrefs = await userPrefsRef.get()
        const currentPrefs = existingPrefs.exists
          ? (existingPrefs.data() as UserPreferences)
          : {}

        // Merge with new preferences
        await userPrefsRef.set(
          {
            ...currentPrefs,
            ...preferences,
          },
          { merge: true }
        )
      } catch (err) {
        console.error("Error saving preferences:", err)
        setError(
          err instanceof Error ? err.message : "Failed to save preferences"
        )
        throw err
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  const saveOnboardingSelections = useCallback(
    async (selectedCategories: string[]) => {
      try {
        await savePreferences({
          topicsOfInterest: selectedCategories,
          preferredCategories: selectedCategories,
          onboarding: {
            completedAt: firestore.Timestamp.now(),
            selectedInterests: selectedCategories.map((categoryId) => ({
              categoryId,
              skillLevel: "beginner",
              subInterests: [],
            })),
            learningGoals: [], // Empty array since we're not using goals yet
          },
        })
      } catch (err) {
        console.error("Error saving onboarding selections:", err)
        throw err
      }
    },
    [savePreferences]
  )

  return {
    loading,
    error,
    savePreferences,
    saveOnboardingSelections,
  }
}
