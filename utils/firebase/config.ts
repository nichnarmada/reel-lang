import auth from "@react-native-firebase/auth"
import firebase from "@react-native-firebase/app"

// No need to explicitly initialize Firebase in React Native Firebase
// It automatically initializes using the google-services.json and GoogleService-Info.plist

// For TypeScript, we can export the firebase instance
export default firebase

// Export auth for convenience
export { auth }
