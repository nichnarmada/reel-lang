import firestore from "@react-native-firebase/firestore"
import type { Video } from "../types/video"

export const videoService = {
  async fetchVideos(limit = 10, lastVideoId?: string) {
    try {
      let query = firestore()
        .collection("videos")
        .orderBy("metadata.uploadedAt", "desc")
        .limit(limit)

      if (lastVideoId) {
        const lastVideo = await firestore()
          .collection("videos")
          .doc(lastVideoId)
          .get()
        query = query.startAfter(lastVideo)
      }

      const snapshot = await query.get()

      // Add some logging to debug
      console.log("Fetched videos:", snapshot.size)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Video[]
    } catch (error) {
      console.error("Error fetching videos:", error)
      throw error
    }
  },
}
