import { AuthProvider } from "../contexts/auth"
import { useEffect } from "react"
import { useSegments, useRouter, Stack } from "expo-router"
import { useAuth } from "../contexts/auth"

// This component handles the auth flow routing
function AuthenticatedLayout() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) {
      console.log("Loading auth state...")
      return
    }

    const inAuthGroup = segments[0] === "(auth)"
    console.log({
      currentSegments: segments,
      firstSegment: segments[0],
      inAuthGroup,
      userExists: !!user,
    })

    if (!user && !inAuthGroup) {
      // Redirect to sign-in if user is not authenticated and not in auth group
      router.replace("/sign-in")
    } else if (user && inAuthGroup) {
      // Redirect to home if user is authenticated and in auth group
      router.replace("/")
    }
  }, [user, loading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthenticatedLayout />
    </AuthProvider>
  )
}
