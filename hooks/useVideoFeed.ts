import { useState, useCallback } from "react"
import { videoService } from "../services/video"
import type { Video } from "../types/video"

export function useVideoFeed() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const loadVideos = useCallback(
    async (refresh = false) => {
      if (loading || (!hasMore && !refresh)) return

      try {
        setLoading(true)
        setError(null)

        const lastVideoId = refresh ? undefined : videos[videos.length - 1]?.id
        const newVideos = await videoService.fetchVideos(10, lastVideoId)

        setVideos((prev) => (refresh ? newVideos : [...prev, ...newVideos]))
        setHasMore(newVideos.length === 10)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load videos")
        )
      } finally {
        setLoading(false)
      }
    },
    [videos, loading, hasMore]
  )

  return {
    videos,
    loading,
    error,
    hasMore,
    loadVideos,
    refresh: () => loadVideos(true),
  }
}
