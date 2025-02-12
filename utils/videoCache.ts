import { Platform } from "react-native"
import * as FileSystem from "expo-file-system"

const VIDEO_CACHE_DIR = `${FileSystem.cacheDirectory}video-cache/`

// Ensure cache directory exists
async function ensureCacheDirectory() {
  const dirInfo = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(VIDEO_CACHE_DIR, {
      intermediates: true,
    })
  }
}

// Get cached path for a URL
function getCachedPath(url: string): string {
  const filename = url.split("/").pop() || Date.now().toString()
  return `${VIDEO_CACHE_DIR}${filename}`
}

export async function prefetchVideo(url: string): Promise<string> {
  try {
    await ensureCacheDirectory()
    const cachedPath = getCachedPath(url)

    // Check if already cached
    const fileInfo = await FileSystem.getInfoAsync(cachedPath)
    if (fileInfo.exists) {
      return Platform.OS === "android" ? cachedPath : `file://${cachedPath}`
    }

    // Download the video
    await FileSystem.downloadAsync(url, cachedPath)
    return Platform.OS === "android" ? cachedPath : `file://${cachedPath}`
  } catch (error) {
    console.warn("Failed to prefetch video:", error)
    // Return original URL if caching fails
    return url
  }
}

export async function clearVideoCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(VIDEO_CACHE_DIR)
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(VIDEO_CACHE_DIR)
    }
  } catch (error) {
    console.warn("Failed to clear video cache:", error)
  }
}
