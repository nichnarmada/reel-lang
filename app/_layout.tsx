import { useSegments, Stack, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { AuthProvider, useAuth } from "../contexts/auth"

// This component handles the auth flow routing
function ProtectedLayout() {
  const { user, loading, hasCompletedOnboarding } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const inAuthGroup = segments[0] === "(auth)"
    const inOnboarding = segments[0] === "onboarding"

    if (loading) return

    if (!user) {
      // If the user is not signed in and the initial segment is not in the auth group
      if (!inAuthGroup) {
        router.replace("/sign-in")
      }
    } else if (!hasCompletedOnboarding) {
      // If the user is signed in but hasn't completed onboarding
      if (!inOnboarding) {
        router.replace("/onboarding")
      }
    } else {
      // If the user is signed in and has completed onboarding
      if (inAuthGroup || inOnboarding) {
        router.replace("/")
      }
    }
  }, [user, loading, hasCompletedOnboarding, segments, mounted])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ProtectedLayout />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
