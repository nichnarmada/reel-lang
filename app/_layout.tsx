import { AuthProvider } from "../contexts/auth"
import { useEffect, useState } from "react"
import { useSegments, Stack, useRouter } from "expo-router"
import { useAuth } from "../contexts/auth"
import { GestureHandlerRootView } from "react-native-gesture-handler"

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

    // Don't redirect if we're still loading any states
    if (loading) {
      return
    }

    // Only proceed with routing logic if we have definitive information
    if (!user) {
      // If the user is not signed in and the initial segment is not in the auth group
      if (!inAuthGroup) {
        router.replace("/sign-in")
      }
    } else {
      // We now have a user, wait for hasCompletedOnboarding to be definitively set
      if (hasCompletedOnboarding === undefined) {
        return
      }

      if (!hasCompletedOnboarding) {
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
