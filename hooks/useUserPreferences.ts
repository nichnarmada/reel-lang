import { Timestamp, setDoc } from "@react-native-firebase/firestore"
import { useState, useCallback, useEffect } from "react"

import { useAuth } from "../contexts/auth"
import { UserPreferences, UserProfile } from "../types/user"
import { getDocument, FIREBASE_COLLECTIONS } from "../utils/firebase/config"

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultSessionLength: 5,
  onboarding: null,
  preferredCategories: [],
  learningGoals: [],
}

export const useUserPreferences = (userId: string) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const { user } = useAuth()

  const fetchPreferences = useCallback(async () => {
    if (!userId || !user) return null

    setLoading(true)
    setError(null)
    try {
      const userDoc = getDocument(FIREBASE_COLLECTIONS.USERS, userId)
      const userSnapshot = await userDoc.get()

      if (!userSnapshot.exists) {
        // Create user document with default preferences
        const defaultUserData = {
          preferences: DEFAULT_PREFERENCES,
          profile: {
            name: user.displayName || "Learner",
            email: user.email || "",
            createdAt: Timestamp.now(),
            lastActive: Timestamp.now(),
          } as UserProfile,
        }
        await setDoc(userDoc, defaultUserData)
        setPreferences(DEFAULT_PREFERENCES)
        return DEFAULT_PREFERENCES
      }

      const userData = userSnapshot.data()
      setPreferences(userData?.preferences || DEFAULT_PREFERENCES)
      return userData?.preferences || DEFAULT_PREFERENCES
    } catch (err) {
      console.error("Error fetching preferences:", err)
      setError(
        err instanceof Error ? err.message : "Failed to fetch preferences"
      )
      return null
    } finally {
      setLoading(false)
    }
  }, [userId, user])

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
              subInterests: [],
            })),
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
