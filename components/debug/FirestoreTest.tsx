import { View, Text } from "react-native"
import { useEffect } from "react"
import { videoService } from "../../services/video"

export default function FirestoreTest() {
  useEffect(() => {
    const testFirestore = async () => {
      try {
        const videos = await videoService.fetchVideos(1)
        console.log("Successfully fetched videos:", videos)
      } catch (error) {
        console.error("Error testing Firestore:", error)
      }
    }

    testFirestore()
  }, [])

  return (
    <View>
      <Text>Check console for Firestore test results</Text>
    </View>
  )
}
