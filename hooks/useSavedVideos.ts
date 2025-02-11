import {
  Timestamp,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore"
import { useState, useEffect } from "react"

import { useAuth } from "../contexts/auth"
import { SavedVideo } from "../types/user"
import {
  getCollection,
  getDocument,
  FIREBASE_COLLECTIONS,
} from "../utils/firebase/config"
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

    const savedVideosCollection = getCollection(
      FIREBASE_COLLECTIONS.SAVED_VIDEOS
    )
    const unsubscribe = savedVideosCollection
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
                    console.error("Error fetching thumbnail:", err)
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
      const savedVideosCollection = getCollection(
        FIREBASE_COLLECTIONS.SAVED_VIDEOS
      )
      const savedVideoRef = savedVideosCollection.doc()

      // If no thumbnail provided, try to fetch it from Pexels
      let thumbnail = videoInfo.thumbnail
      if (!thumbnail) {
        try {
          thumbnail = await getVideoThumbnail(videoInfo.id)
        } catch (err) {
          console.error("Error fetching thumbnail:", err)
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
        savedAt: Timestamp.now().toDate().toISOString(),
      }

      await savedVideoRef.set(savedVideo)

      // Try to update video engagement counter if the video exists
      try {
        const videoDoc = getDocument(FIREBASE_COLLECTIONS.VIDEOS, videoInfo.id)
        const videoSnapshot = await videoDoc.get()

        if (videoSnapshot.exists) {
          await videoDoc.update({
            "engagement.saves": FirebaseFirestoreTypes.FieldValue.increment(1),
          })
        }
      } catch (engagementErr) {
        // Ignore engagement update errors - the video might be from an external source
        console.error(
          "Skipping engagement update for external video:",
          engagementErr
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
      const savedVideoDoc = getDocument(
        FIREBASE_COLLECTIONS.SAVED_VIDEOS,
        savedVideoId
      )
      await savedVideoDoc.delete()

      // Try to update video engagement counter if the video exists
      try {
        const videoDoc = getDocument(FIREBASE_COLLECTIONS.VIDEOS, videoId)
        const videoSnapshot = await videoDoc.get()

        if (videoSnapshot.exists) {
          await videoDoc.update({
            "engagement.saves": FirebaseFirestoreTypes.FieldValue.increment(-1),
          })
        }
      } catch (engagementErr) {
        // Ignore engagement update errors - the video might be from an external source
        console.error(
          "Skipping engagement update for external video:",
          engagementErr
        )
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
