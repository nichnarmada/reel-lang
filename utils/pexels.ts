import { createClient, Videos, ErrorResponse } from "pexels"

// TODO: Move to environment variables
const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY || ""
const client = createClient(PEXELS_API_KEY)

export type PexelsVideo = {
  id: number
  width: number
  height: number
  duration: number
  url: string
  video_files: {
    id: number
    quality: string
    file_type: string
    width: number
    height: number
    link: string
  }[]
}

export async function searchVideos(query: string, perPage: number = 10) {
  if (!PEXELS_API_KEY) {
    throw new Error("Please provide a valid Pexels API key")
  }

  try {
    const response = (await client.videos.search({
      query,
      per_page: perPage,
    })) as Videos | ErrorResponse

    if ("error" in response) {
      throw new Error(`Pexels API error: ${response.error}`)
    }

    if (!response.videos || !Array.isArray(response.videos)) {
      throw new Error("Invalid response format from Pexels API")
    }

    return response.videos as PexelsVideo[]
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching videos from Pexels:", error.message)
      throw error
    }
    throw new Error("Unknown error occurred while fetching videos")
  }
}

// Helper to get the best quality video URL that's not too large
export function getBestVideoUrl(video: PexelsVideo): string {
  // Sort video files by height (quality) in descending order
  const sortedFiles = [...video.video_files].sort((a, b) => b.height - a.height)

  // Find the first video that's HD (720p) or lower to save bandwidth
  const hdVideo = sortedFiles.find(
    (file) =>
      file.height <= 720 &&
      (file.file_type === "video/mp4" || file.file_type === "video/quicktime")
  )

  // Fallback to the first mp4/quicktime if no HD version found
  const fallbackVideo = sortedFiles.find(
    (file) =>
      file.file_type === "video/mp4" || file.file_type === "video/quicktime"
  )

  return hdVideo?.link || fallbackVideo?.link || video.video_files[0].link
}
