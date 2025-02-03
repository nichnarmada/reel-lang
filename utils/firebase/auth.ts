import auth from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId:
    "341307047865-9uhnp8vvuafb7d0o2l04av5gvliu9vcb.apps.googleusercontent.com",
})

export interface AuthError {
  code: string
  message: string
}

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password
    )
    return userCredential.user
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code),
    }
  }
}

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(
      email,
      password
    )
    return userCredential.user
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code),
    }
  }
}

export const signInWithGoogle = async () => {
  try {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices()
    // Get the users ID token
    const { idToken } = await GoogleSignin.signIn()
    // Create a Google credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken)
    // Sign-in with credential
    const userCredential = await auth().signInWithCredential(googleCredential)
    return userCredential.user
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code),
    }
  }
}

export const signOut = async () => {
  try {
    await GoogleSignin.signOut() // Sign out from Google
    await auth().signOut() // Sign out from Firebase
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code),
    }
  }
}

// Helper function to get user-friendly error messages
const getErrorMessage = (code: string): string => {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address"
    case "auth/user-disabled":
      return "This account has been disabled"
    case "auth/user-not-found":
      return "No account found with this email"
    case "auth/wrong-password":
      return "Incorrect password"
    case "auth/email-already-in-use":
      return "An account already exists with this email"
    case "auth/weak-password":
      return "Password should be at least 6 characters"
    case "auth/operation-not-allowed":
      return "Operation not allowed"
    case "auth/network-request-failed":
      return "Network error - please check your connection"
    default:
      return "An error occurred. Please try again"
  }
}
