import { VideoSegmentType } from "../../types/content"
import ReactNativeBlobUtil from "react-native-blob-util"
import { Audio } from "expo-av"

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"
const API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY

// Voice IDs for all available voices
const VOICE_IDS = {
  Brian: "nPczCjzI2devNBz1zQrb",
  Charlie: "IKne3meq5aSn9XLyUdCD",
  Daniel: "onwK4e9ZLuTAKqWW03F9",
  Eric: "cjVigY5qzO86Huf0OWal",
  George: "JBFqnCBsd6RMkjVDRZzb",
  Liam: "TX3LPaxmHKxFdv7VOQHJ",
  Lily: "pFZP5JQG7iQjIQuC4Bku",
  Matilda: "XrExE9yKIg1WjnnlVkGX",
  Will: "bIHbv24MWmeRgasZH58o",
} as const

// Voice pools for different segment types
const VOICE_POOLS = {
  core: [VOICE_IDS.Brian, VOICE_IDS.Daniel, VOICE_IDS.George], // Professional voices
  quick: [VOICE_IDS.Charlie, VOICE_IDS.Will, VOICE_IDS.Eric], // Energetic voices
  recap: [VOICE_IDS.Lily, VOICE_IDS.Matilda], // Clear voices
} as const

// Helper function to get random voice from a pool
const getRandomVoice = (pool: readonly string[]): string => {
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex]
}

// Voice mapping function
export const getVoiceForSegment = (segmentType: VideoSegmentType): string => {
  return getRandomVoice(VOICE_POOLS[segmentType])
}

export interface TextToSpeechRequest {
  text: string
  model_id?: string
  voice_settings?: {
    stability: number
    similarity_boost: number
    style: number
    use_speaker_boost: boolean
  }
}

export interface TextToSpeechResponse {
  audioPath: string
  duration: number
  sound: Audio.Sound
}

export class ElevenLabsService {
  private static instance: ElevenLabsService
  private constructor() {}

  public static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService()
    }
    return ElevenLabsService.instance
  }

  /**
   * Wait for a sound to finish playing
   */
  private waitForSoundToFinish(sound: Audio.Sound): Promise<void> {
    return new Promise((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          resolve()
        }
      })
    })
  }

  /**
   * Generate audio from text using ElevenLabs API
   */
  async generateAudio(
    text: string,
    segmentType: VideoSegmentType
  ): Promise<TextToSpeechResponse> {
    try {
      const voiceId = getVoiceForSegment(segmentType)

      // Calculate word count and estimated duration
      const wordCount = text.split(" ").length
      const averageWordsPerMinute = 150
      const durationInMinutes = wordCount / averageWordsPerMinute
      const durationInSeconds = durationInMinutes * 60

      // Check if text is too long (ElevenLabs has a limit)
      const MAX_CHARS = 2500
      if (text.length > MAX_CHARS) {
        console.warn("Text too long for ElevenLabs API, truncating:", {
          originalLength: text.length,
          truncatedLength: MAX_CHARS,
        })
        text = text.substring(0, MAX_CHARS)
      }

      console.log("Generating audio with ElevenLabs:", {
        textLength: text.length,
        text,
        segmentType,
        voiceId,
        wordCount,
        estimatedDuration: durationInSeconds,
      })

      // Make the API request using react-native-blob-util
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        appendExt: "mp3",
      }).fetch(
        "POST",
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
        {
          "Content-Type": "application/json",
          "xi-api-key": API_KEY!,
        },
        JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        } satisfies TextToSpeechRequest)
      )

      if (response.respInfo.status !== 200) {
        const errorBody = await response.text()
        console.error("ElevenLabs API error details:", {
          status: response.respInfo.status,
          body: errorBody,
          voiceId,
          textLength: text.length,
        })
        throw new Error(
          `ElevenLabs API error: ${response.respInfo.status} - ${errorBody}`
        )
      }

      const filePath = response.path()

      // Create audio player
      const { sound } = await Audio.Sound.createAsync(
        { uri: `file://${filePath}` },
        { shouldPlay: false, progressUpdateIntervalMillis: 10 }
      )

      return {
        audioPath: filePath,
        duration: durationInSeconds,
        sound,
      }
    } catch (error) {
      console.error("Error generating audio:", error)
      throw error
    }
  }

  /**
   * Clean up cached audio file
   */
  async cleanupAudio(filePath: string): Promise<void> {
    try {
      await ReactNativeBlobUtil.fs.unlink(filePath)
    } catch (error) {
      console.warn("Error cleaning up audio file:", error)
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices() {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
        headers: {
          "xi-api-key": API_KEY!,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching voices:", error)
      throw error
    }
  }
}
