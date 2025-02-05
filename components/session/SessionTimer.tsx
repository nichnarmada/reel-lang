import React, { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, Platform } from "react-native"

type SessionTimerProps = {
  durationMinutes: number
  onTimeUp: () => void
}

export default function SessionTimer({
  durationMinutes,
  onTimeUp,
}: SessionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60) // Convert to seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onTimeUp])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }, [])

  const isNearingEnd = timeRemaining <= 60 // Last minute

  return (
    <View style={styles.container}>
      <Text style={[styles.timerText, isNearingEnd && styles.timerTextWarning]}>
        {formatTime(timeRemaining)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  timerTextWarning: {
    color: "#ff4444",
  },
})
