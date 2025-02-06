import { AuthProvider } from "../contexts/auth"
import { useEffect } from "react"
import { useSegments, useRouter, Stack } from "expo-router"
import { useAuth } from "../contexts/auth"
import { TopicsProvider } from "../contexts/topics"

// This component handles the auth flow routing
function AuthenticatedLayout() {
  const { user, loading, hasCompletedOnboarding } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) {
      console.log("Loading auth state...")
      return
    }

    const inAuthGroup = segments[0] === "(auth)"
    const inOnboarding = segments[0] === "onboarding"

    console.log({
      currentSegments: segments,
      firstSegment: segments[0],
      inAuthGroup,
      inOnboarding,
      userExists: !!user,
      hasCompletedOnboarding,
    })

    if (!user && !inAuthGroup) {
      // Redirect to sign-in if user is not authenticated and not in auth group
      router.replace("/sign-in")
    } else if (user && !hasCompletedOnboarding && !inOnboarding) {
      // Redirect to onboarding if user hasn't completed it
      router.replace("/onboarding")
    } else if (
      user &&
      hasCompletedOnboarding &&
      (inAuthGroup || inOnboarding)
    ) {
      // Redirect to home if user is authenticated and has completed onboarding
      router.replace("/")
    }
  }, [user, loading, hasCompletedOnboarding, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TopicsProvider>
        <AuthenticatedLayout />
      </TopicsProvider>
    </AuthProvider>
  )
}
