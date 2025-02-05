import { useState, useEffect } from "react"
import { useAuth } from "../contexts/auth"
import firestore from "@react-native-firebase/firestore"
import { SavedVideo } from "../types/user"
import { FIREBASE_COLLECTIONS } from "../utils/firebase/config"
import { getVideoThumbnail } from "../utils/pexels"

export function useSavedVideos() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<SavedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setVideos([])
      setLoading(false)
      return
    }

    const unsubscribe = firestore()
      .collection(FIREBASE_COLLECTIONS.SAVED_VIDEOS)
      .where("userId", "==", user.uid)
      .orderBy("savedAt", "desc")
      .onSnapshot(
        async (snapshot) => {
          try {
            const savedVideos = await Promise.all(
              snapshot.docs.map(async (doc) => {
                const data = doc.data()
                // If no thumbnail, try to fetch it from Pexels
                if (!data.thumbnail) {
                  try {
                    const thumbnail = await getVideoThumbnail(data.videoId)
                    // Update the document with the thumbnail
                    await doc.ref.update({ thumbnail })
                    return {
                      id: doc.id,
                      ...data,
                      thumbnail,
                    } as SavedVideo
                  } catch (err) {
                    console.log("Error fetching thumbnail:", err)
                    return {
                      id: doc.id,
                      ...data,
                    } as SavedVideo
                  }
                }
                return {
                  id: doc.id,
                  ...data,
                } as SavedVideo
              })
            )
            setVideos(savedVideos)
            setLoading(false)
          } catch (err) {
            console.error("Error processing saved videos:", err)
            setError("Failed to load saved videos")
            setLoading(false)
          }
        },
        (err) => {
          console.error("Error fetching saved videos:", err)
          setError("Failed to load saved videos")
          setLoading(false)
        }
      )

    return () => unsubscribe()
  }, [user])

  const saveVideo = async (videoInfo: {
    id: string
    title: string
    description: string
    thumbnail: string
    duration: string
    topicId: string
    topicName: string
  }) => {
    if (!user) return

    try {
      const savedVideoRef = firestore()
        .collection(FIREBASE_COLLECTIONS.SAVED_VIDEOS)
        .doc()

      // If no thumbnail provided, try to fetch it from Pexels
      let thumbnail = videoInfo.thumbnail
      if (!thumbnail) {
        try {
          thumbnail = await getVideoThumbnail(videoInfo.id)
        } catch (err) {
          console.log("Error fetching thumbnail:", err)
        }
      }

      const savedVideo: Omit<SavedVideo, "id"> = {
        userId: user.uid,
        videoId: videoInfo.id,
        title: videoInfo.title,
        description: videoInfo.description,
        thumbnail,
        duration: videoInfo.duration,
        topicId: videoInfo.topicId,
        topicName: videoInfo.topicName,
        savedAt: firestore.Timestamp.now().toDate().toISOString(),
      }

      await savedVideoRef.set(savedVideo)

      // Try to update video engagement counter if the video exists
      try {
        const videoDoc = await firestore()
          .collection(FIREBASE_COLLECTIONS.VIDEOS)
          .doc(videoInfo.id)
          .get()

        if (videoDoc.exists) {
          await firestore()
            .collection(FIREBASE_COLLECTIONS.VIDEOS)
            .doc(videoInfo.id)
            .update({
              "engagement.saves": firestore.FieldValue.increment(1),
            })
        }
      } catch (engagementErr) {
        // Ignore engagement update errors - the video might be from an external source
        console.log(
          "Skipping engagement update for external video:",
          videoInfo.id
        )
      }
    } catch (err) {
      console.error("Error saving video:", err)
      throw new Error("Failed to save video")
    }
  }

  const removeVideo = async (savedVideoId: string, videoId: string) => {
    if (!user) return

    try {
      await firestore()
        .collection(FIREBASE_COLLECTIONS.SAVED_VIDEOS)
        .doc(savedVideoId)
        .delete()

      // Try to update video engagement counter if the video exists
      try {
        const videoDoc = await firestore()
          .collection(FIREBASE_COLLECTIONS.VIDEOS)
          .doc(videoId)
          .get()

        if (videoDoc.exists) {
          await firestore()
            .collection(FIREBASE_COLLECTIONS.VIDEOS)
            .doc(videoId)
            .update({
              "engagement.saves": firestore.FieldValue.increment(-1),
            })
        }
      } catch (engagementErr) {
        // Ignore engagement update errors - the video might be from an external source
        console.log("Skipping engagement update for external video:", videoId)
      }
    } catch (err) {
      console.error("Error removing video:", err)
      throw new Error("Failed to remove video")
    }
  }

  return {
    videos,
    loading,
    error,
    saveVideo,
    removeVideo,
  }
}
