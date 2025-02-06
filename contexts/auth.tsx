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
import firestore from "@react-native-firebase/firestore"
import { FIREBASE_COLLECTIONS } from "../utils/firebase/config"
import { User, UserStats } from "../types/user"

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
      const userDoc = await firestore()
        .collection(FIREBASE_COLLECTIONS.USERS)
        .doc(user.uid)
        .get()

      if (!userDoc.exists) return false

      const userData = userDoc.data() as User
      const completed = !!userData.preferences?.onboarding?.completedAt
      setHasCompletedOnboarding(completed)
      return completed
    } catch (err) {
      console.error("Error checking onboarding status:", err)
      return false
    }
  }

  const setOnboardingComplete = async () => {
    setHasCompletedOnboarding(true)
  }

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        // Check if user document exists
        const userDoc = await firestore()
          .collection(FIREBASE_COLLECTIONS.USERS)
          .doc(user.uid)
          .get()

        // If user document doesn't exist, create it with default values
        if (!userDoc.exists) {
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
              createdAt: firestore.Timestamp.now(),
              lastActive: firestore.Timestamp.now(),
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

          await firestore()
            .collection(FIREBASE_COLLECTIONS.USERS)
            .doc(user.uid)
            .set(userData)

          setHasCompletedOnboarding(false)
        } else {
          // Check onboarding status from existing user
          await checkOnboardingStatus()
        }
      } else {
        setHasCompletedOnboarding(false)
      }
      setUser(user)
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
