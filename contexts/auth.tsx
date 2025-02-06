import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  AuthError,
} from "../utils/firebase/auth"
import { getDocument, FIREBASE_COLLECTIONS } from "../utils/firebase/config"
import { User, UserStats } from "../types/user"
import { Timestamp } from "@react-native-firebase/firestore"

interface AuthContextType {
  user: FirebaseAuthTypes.User | null
  loading: boolean
  error: string | null
  hasCompletedOnboarding: boolean
  checkOnboardingStatus: () => Promise<boolean>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  googleSignIn: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  setOnboardingComplete: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  const checkOnboardingStatus = async () => {
    if (!user) return false

    try {
      console.log("[Auth] Checking onboarding status for user:", user.uid)

      const userDoc = getDocument(FIREBASE_COLLECTIONS.USERS, user.uid)
      const userSnapshot = await userDoc.get()

      if (!userSnapshot.exists) {
        console.log("[Auth] User document does not exist")
        return false
      }

      const userData = userSnapshot.data() as User
      console.log("[Auth] User preferences:", {
        preferences: userData.preferences,
        onboarding: userData.preferences?.onboarding,
        completedAt: userData.preferences?.onboarding?.completedAt,
      })

      const completed = !!userData.preferences?.onboarding?.completedAt
      console.log("[Auth] Onboarding completed:", completed)

      setHasCompletedOnboarding(completed)
      return completed
    } catch (err) {
      console.error("[Auth] Error checking onboarding status:", err)
      return false
    }
  }

  const setOnboardingComplete = async () => {
    if (!user) return

    try {
      // Update Firestore
      const userDoc = getDocument(FIREBASE_COLLECTIONS.USERS, user.uid)
      await userDoc.update({
        "preferences.onboarding": {
          completedAt: Timestamp.now(),
        },
      })

      // Update local state
      setHasCompletedOnboarding(true)
    } catch (err) {
      console.error("[Auth] Error setting onboarding complete:", err)
      throw err
    }
  }

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      console.log("[Auth] Auth state changed:", {
        userId: user?.uid,
        isAuthenticated: !!user,
      })

      setUser(user)

      if (user) {
        try {
          // Check if user document exists
          const userDoc = getDocument(FIREBASE_COLLECTIONS.USERS, user.uid)
          const userSnapshot = await userDoc.get()

          if (!userSnapshot.exists) {
            console.log("[Auth] Creating new user document")
            // If user document doesn't exist, create it with default values
            const defaultStats: UserStats = {
              totalLearningTime: 0,
              sessionsCompleted: 0,
              topicsProgress: {
                explored: [],
                recentlyActive: [],
              },
              quizStats: {
                totalQuizzes: 0,
                averageScore: 0,
                bestScore: 0,
                completionRate: 0,
              },
              learningStreaks: {
                current: 0,
                longest: 0,
                lastActiveDate: new Date().toISOString(),
                weeklyActivity: {},
              },
              weeklyProgress: {
                timeSpent: Array(7).fill(0),
              },
            }

            const userData: Partial<User> = {
              uid: user.uid,
              profile: {
                name: user.displayName || "Learner",
                email: user.email || "",
                photoURL: user.photoURL || undefined,
                createdAt: Timestamp.now(),
                lastActive: Timestamp.now(),
              },
              preferences: {
                defaultSessionLength: 5,
                topicsOfInterest: [],
                difficultyPreference: "beginner",
                onboarding: null,
                preferredCategories: [],
                skillLevels: {},
                learningGoals: [],
              },
              stats: defaultStats,
              achievements: [],
            }

            await userDoc.set(userData)
            setHasCompletedOnboarding(false)
          } else {
            // Check onboarding status from existing user
            const userData = userSnapshot.data() as User
            const completed = !!userData.preferences?.onboarding?.completedAt
            console.log("[Auth] Onboarding completed:", completed)
            setHasCompletedOnboarding(completed)
          }
        } catch (error) {
          console.error("[Auth] Error checking user status:", error)
          setHasCompletedOnboarding(false)
        }
      } else {
        setHasCompletedOnboarding(false)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleAuthError = (error: AuthError) => {
    setError(error.message)
    setLoading(false)
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      await signInWithEmail(email, password)
    } catch (error) {
      handleAuthError(error as AuthError)
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      await signUpWithEmail(email, password)
    } catch (error) {
      handleAuthError(error as AuthError)
    }
  }

  const googleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (error) {
      handleAuthError(error as AuthError)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      await firebaseSignOut()
      setHasCompletedOnboarding(false)
    } catch (error) {
      handleAuthError(error as AuthError)
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        hasCompletedOnboarding,
        checkOnboardingStatus,
        signIn,
        signUp,
        googleSignIn,
        signOut,
        clearError,
        setOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
