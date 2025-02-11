import storage from "@react-native-firebase/storage"
import firestore from "@react-native-firebase/firestore"
import * as FileSystem from "expo-file-system"
import { VideoSegmentScript } from "../../types/content"
import { ElevenLabsService } from "./elevenlabs"
import { Platform } from "react-native"

export interface AudioSegment {
  url: string
  duration: number
  generatedAt: Date
  status: "pending" | "completed" | "error"
}

export class AudioGenerationService {
  private static instance: AudioGenerationService
  private elevenLabs: ElevenLabsService

  private constructor() {
    this.elevenLabs = ElevenLabsService.getInstance()
  }

  public static getInstance(): AudioGenerationService {
    if (!AudioGenerationService.instance) {
      AudioGenerationService.instance = new AudioGenerationService()
    }
    return AudioGenerationService.instance
  }

  /**
   * Generate audio for a video segment and store it in Firebase
   */
  async generateAndStoreAudio(
    sessionId: string,
    segment: VideoSegmentScript
  ): Promise<AudioSegment> {
    try {
      // Update status to pending
      await this.updateAudioStatus(sessionId, segment.id, "pending")

      // Generate audio using ElevenLabs
      const { audioPath, duration, sound } =
        await this.elevenLabs.generateAudio(
          segment.script.text,
          segment.segmentType
        )

      // Unload the sound to free up resources
      await sound.unloadAsync()

      // Format the file path for Firebase Storage
      const formattedPath =
        Platform.OS === "android" ? audioPath : `file://${audioPath}`

      // Upload to Firebase Storage
      const storageRef = storage().ref(
        `sessions/${sessionId}/audio/${segment.id}.mp3`
      )

      // Upload the file
      await storageRef.putFile(formattedPath)

      // Get the download URL
      const downloadUrl = await storageRef.getDownloadURL()

      // Clean up the temporary file
      await this.elevenLabs.cleanupAudio(audioPath)

      // Create audio segment metadata
      const audioSegment: AudioSegment = {
        url: downloadUrl,
        duration,
        generatedAt: new Date(),
        status: "completed",
      }

      // Store metadata in Firestore
      await this.storeAudioMetadata(sessionId, segment.id, audioSegment)

      return audioSegment
    } catch (error) {
      console.error("Error generating audio:", error)
      await this.updateAudioStatus(sessionId, segment.id, "error")
      throw error
    }
  }

  /**
   * Store audio metadata in Firestore
   */
  private async storeAudioMetadata(
    sessionId: string,
    segmentId: string,
    audioSegment: AudioSegment
  ) {
    await firestore()
      .collection("sessions")
      .doc(sessionId)
      .collection("audio")
      .doc(segmentId)
      .set(audioSegment)
  }

  /**
   * Update audio generation status
   */
  private async updateAudioStatus(
    sessionId: string,
    segmentId: string,
    status: AudioSegment["status"]
  ) {
    await firestore()
      .collection("sessions")
      .doc(sessionId)
      .collection("audio")
      .doc(segmentId)
      .set({ status }, { merge: true })
  }

  /**
   * Generate audio for all segments in a session
   */
  async generateSessionAudio(
    sessionId: string,
    segments: VideoSegmentScript[]
  ): Promise<AudioSegment[]> {
    const audioSegments: AudioSegment[] = []

    for (const segment of segments) {
      const audioSegment = await this.generateAndStoreAudio(sessionId, segment)
      audioSegments.push(audioSegment)
    }

    return audioSegments
  }

  /**
   * Get audio metadata for a segment
   */
  async getAudioMetadata(
    sessionId: string,
    segmentId: string
  ): Promise<AudioSegment | null> {
    const doc = await firestore()
      .collection("sessions")
      .doc(sessionId)
      .collection("audio")
      .doc(segmentId)
      .get()

    return doc.exists ? (doc.data() as AudioSegment) : null
  }
}
