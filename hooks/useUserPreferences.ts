import { useState, useCallback, useEffect } from "react"
import { getDocument, getCollection } from "../utils/firebase/config"
import { FIREBASE_COLLECTIONS } from "../utils/firebase/config"
import { UserPreferences } from "../types/user"
import { Timestamp } from "@react-native-firebase/firestore"

export const useUserPreferences = (userId: string) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  const fetchPreferences = useCallback(async () => {
    if (!userId) return null

    setLoading(true)
    setError(null)
    try {
      const userDoc = getDocument(FIREBASE_COLLECTIONS.USERS, userId)
      const userSnapshot = await userDoc.get()

      if (!userSnapshot.exists) {
        throw new Error("User document not found")
      }

      const userData = userSnapshot.data()
      setPreferences(userData?.preferences || null)
      return userData?.preferences
    } catch (err) {
      console.error("Error fetching preferences:", err)
      setError(
        err instanceof Error ? err.message : "Failed to fetch preferences"
      )
      return null
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const savePreferences = useCallback(
    async (preferences: Partial<UserPreferences>) => {
      setLoading(true)
      setError(null)
      try {
        const userDoc = getDocument(FIREBASE_COLLECTIONS.USERS, userId)

        // Get existing user data first
        const userSnapshot = await userDoc.get()
        if (!userSnapshot.exists) {
          throw new Error("User document not found")
        }

        // Update preferences field directly
        await userDoc.update({
          preferences: {
            ...userSnapshot.data()?.preferences,
            ...preferences,
          },
        })
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
          preferredCategories: selectedCategories,
          onboarding: {
            completedAt: Timestamp.now(),
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
    preferences,
    savePreferences,
    saveOnboardingSelections,
    fetchPreferences,
  }
}
