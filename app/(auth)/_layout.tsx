import { Stack } from "expo-router"

import { AuthProvider } from "../../contexts/auth"

export default function AuthLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </AuthProvider>
  )
}
