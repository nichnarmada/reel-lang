import { AudioGenerationService } from "../audioGenerationService"
import { VideoSegmentScript } from "../../../types/content"

describe("AudioGenerationService", () => {
  let service: AudioGenerationService

  beforeEach(() => {
    service = AudioGenerationService.getInstance()
  })

  it("should generate and store audio for a segment", async () => {
    const mockSessionId = "test-session-123"
    const mockSegment: VideoSegmentScript = {
      id: "test-segment-1",
      order: 1,
      conceptIds: ["concept-1"],
      segmentType: "core",
      script: {
        text: "This is a test script for audio generation.",
        visualCues: ["Show example"],
        duration: 30,
        hooks: "Introduction",
      },
      keyPoints: ["Test point 1"],
      targetDuration: 30,
    }

    const result = await service.generateAndStoreAudio(
      mockSessionId,
      mockSegment
    )

    expect(result).toBeDefined()
    expect(result.url).toBeDefined()
    expect(result.duration).toBeGreaterThan(0)
    expect(result.status).toBe("completed")
  })

  it("should generate audio for multiple segments", async () => {
    const mockSessionId = "test-session-123"
    const mockSegments: VideoSegmentScript[] = [
      {
        id: "test-segment-1",
        order: 1,
        conceptIds: ["concept-1"],
        segmentType: "core",
        script: {
          text: "First test segment.",
          visualCues: ["Show example 1"],
          duration: 15,
          hooks: "First hook",
        },
        keyPoints: ["Point 1"],
        targetDuration: 15,
      },
      {
        id: "test-segment-2",
        order: 2,
        conceptIds: ["concept-2"],
        segmentType: "quick",
        script: {
          text: "Second test segment.",
          visualCues: ["Show example 2"],
          duration: 15,
          hooks: "Second hook",
        },
        keyPoints: ["Point 2"],
        targetDuration: 15,
      },
    ]

    const results = await service.generateSessionAudio(
      mockSessionId,
      mockSegments
    )

    expect(results).toHaveLength(2)
    results.forEach((result) => {
      expect(result.url).toBeDefined()
      expect(result.duration).toBeGreaterThan(0)
      expect(result.status).toBe("completed")
    })
  })
})
