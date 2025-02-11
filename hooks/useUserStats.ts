import firestore from "@react-native-firebase/firestore"
import { useEffect, useState } from "react"

import { UserStats } from "../types/user"

export function useUserStats(userId: string | undefined) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const unsubscribe = firestore()
      .collection("users")
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const userData = doc.data()
            setStats(userData?.stats || null)
          } else {
            setStats(null)
          }
          setLoading(false)
        },
        (err) => {
          console.error("Error fetching user stats:", err)
          setError(err as Error)
          setLoading(false)
        }
      )

    return () => unsubscribe()
  }, [userId])

  return { stats, loading, error }
}

// Helper functions to format stats
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export const calculateDailyGoalProgress = (
  timeSpentToday: number,
  dailyGoal: number = 30
): number => {
  return Math.min((timeSpentToday / dailyGoal) * 100, 100)
}
