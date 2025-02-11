import { ElevenLabsService } from "../elevenlabs"

describe("ElevenLabsService", () => {
  let service: ElevenLabsService

  beforeEach(() => {
    service = ElevenLabsService.getInstance()
  })

  it("should generate audio for a test message", async () => {
    const testText = "Hello, this is a test message."
    const result = await service.generateAudio(testText, "core")

    expect(result).toBeDefined()
    expect(result.audioUrl).toBeDefined()
    expect(result.duration).toBeGreaterThan(0)
  })

  it("should fetch available voices", async () => {
    const voices = await service.getVoices()
    expect(voices).toBeDefined()
    expect(Array.isArray(voices)).toBe(true)
  })
})
