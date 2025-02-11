import { Timestamp } from "@react-native-firebase/firestore"

import {
  EducationalStructure,
  VideoSegmentScript,
  GeneratedContent,
  calculateSegmentPlan,
  SegmentDurationGuide,
} from "./types"
import { DifficultyLevel } from "../../types"
import { SessionDuration } from "../../types/session"
import { GeneratedTopic } from "../../types/topic"
import { topicSuggestionModel } from "../../utils/gemini/config"

const buildEducationalContentPrompt = (
  topic: GeneratedTopic,
  difficulty: DifficultyLevel,
  segmentPlan: SegmentDurationGuide[]
): string => {
  const isShortSession = segmentPlan.length <= 2

  return `Generate ${
    isShortSession ? "focused" : "comprehensive"
  } educational content for:
Topic: ${topic.name}
Description: ${topic.description}
Difficulty Level: ${difficulty}
Number of Segments: ${segmentPlan.length}
Session Type: ${isShortSession ? "Quick Focus" : "In-depth Learning"}
Search Terms: ${topic.searchTerms.join(", ")}

Generate content in the following JSON format (return exactly this structure):
{
  "concepts": [
    {
      "id": "concept_1",
      "name": "Main concept name",
      "description": "Clear, concise explanation",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "examples": ["Practical example 1", "Real-world example 2"],
      "importance": 0.9,
      "segmentType": "${segmentPlan[0].type}"
    }
  ],
  "learningObjectives": [
    "After this session, learners will understand...",
    "Learners will be able to explain..."
  ],
  "prerequisites": [
    "Basic understanding of...",
    "Familiarity with..."
  ],
  "segmentPlan": ${JSON.stringify(segmentPlan)}
}

Important:
- Return a single JSON object with the exact structure above
- The concepts array must contain exactly ${segmentPlan.length} concepts
- Each concept must have all fields shown in the example
- Do not include any text outside the JSON object
- Do not include markdown formatting (no \`\`\`)

Segment Types:
1. Core (${
    segmentPlan.filter((s) => s.type === "core").length
  }): In-depth explanations of main concepts
2. Quick (${
    segmentPlan.filter((s) => s.type === "quick").length
  }): Focused insights and key points
3. Recap (${
    segmentPlan.filter((s) => s.type === "recap").length
  }): Brief summaries and reinforcement

Requirements:
1. Generate exactly ${segmentPlan.length} concepts matching the segment plan
2. Assign appropriate segmentType to each concept based on the segment plan order
3. Examples should be practical and match the segment type:
   - Core: Detailed examples with context
   - Quick: Concise, memorable examples
   - Recap: Review of previous examples
4. Key points per concept:
   - Core: 4-5 detailed points
   - Quick: 2-3 focused points
   - Recap: 3-4 summary points
5. Learning objectives should be measurable and achievable
6. Content should match the ${difficulty} difficulty level
7. Prerequisites should be minimal for beginner level
8. Use clear, engaging language appropriate for each segment type
9. Adjust depth based on segment type and difficulty

Return only the JSON array, no additional text or formatting.`
}

const buildVideoScriptPrompt = (
  topic: GeneratedTopic,
  structure: EducationalStructure,
  segmentPlan: SegmentDurationGuide[]
): string => {
  const conceptsList = structure.concepts
    .map((c, i) => {
      const segment = segmentPlan[i]
      return `${c.name}:
- Type: ${segment.type}
- Duration: ${segment.targetDuration}s
- Description: ${c.description}`
    })
    .join("\n\n")

  return `Generate varied video scripts for:
Topic: ${topic.name}
Concepts to Cover:
${conceptsList}

Generate video segments in the following JSON format:
[
  {
    "id": "segment_1",
    "order": 1,
    "conceptIds": ["concept_1"],
    "segmentType": "core",
    "script": {
      "text": "Engaging script content here without any timestamps or time markers",
      "visualCues": ["Show diagram of X", "Highlight Y"],
      "duration": 60,
      "hooks": "Attention-grabbing opening line"
    },
    "keyPoints": ["Main point 1", "Key idea 2"],
    "targetDuration": 60
  }
]

Script Requirements by Type:
1. Core Segments (${segmentPlan.filter((s) => s.type === "core").length}):
   - Comprehensive explanations
   - Multiple visual aids
   - Detailed examples
   - Smooth, educational pacing
   - No timestamps or time markers in the text

2. Quick Segments (${segmentPlan.filter((s) => s.type === "quick").length}):
   - Rapid, focused delivery
   - Single clear visual per point
   - Actionable insights
   - High-energy pacing
   - No timestamps or time markers in the text

3. Recap Segments (${segmentPlan.filter((s) => s.type === "recap").length}):
   - Review key takeaways
   - Visual summaries
   - Connection to previous segments
   - Reinforcement of main points
   - No timestamps or time markers in the text

General Requirements:
1. Create exactly ${structure.segmentPlan.length} segments
2. Match each segment's duration to the plan
3. Use appropriate pacing and style for each segment type
4. Include clear visual cues
5. Start each segment with a hook matching its type:
   - Core: Thought-provoking questions
   - Quick: Surprising facts
   - Recap: Connection to previous learning
6. Adjust language complexity to ${topic.selectedDifficulty || "beginner"} level
7. Script length should match segment duration and type
8. End each segment appropriately:
   - Core: Clear understanding check
   - Quick: Action item or key insight
   - Recap: Bridge to next concept
9. Do not include any timestamps, time markers, or time-based annotations in the script text

Return only the JSON array, no additional text or formatting.`
}

const processEducationalContent = async (
  response: string,
  difficulty: DifficultyLevel,
  segmentPlan: SegmentDurationGuide[]
): Promise<EducationalStructure | null> => {
  try {
    console.log("Processing educational content response:", {
      responseLength: response.length,
      difficulty,
      segmentPlanLength: segmentPlan.length,
    })

    // First, try to clean any potential markdown or extra text
    let cleanedResponse = response
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/,(\s*[\]}])/g, "$1")

    // Try to find the JSON object if there's extra text
    const jsonStart = cleanedResponse.indexOf("{")
    const jsonEnd = cleanedResponse.lastIndexOf("}")
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedResponse = cleanedResponse.slice(jsonStart, jsonEnd + 1)
    }

    console.log("Cleaned response:", cleanedResponse)

    let parsed
    try {
      parsed = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      console.error("Failed to parse response:", cleanedResponse)
      return null
    }

    // Validate the structure
    const validationErrors: string[] = []

    if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
      validationErrors.push("Missing or invalid concepts array")
    } else if (parsed.concepts.length !== segmentPlan.length) {
      validationErrors.push(
        `Expected ${segmentPlan.length} concepts, got ${parsed.concepts.length}`
      )
    }

    if (
      !parsed.learningObjectives ||
      !Array.isArray(parsed.learningObjectives)
    ) {
      validationErrors.push("Missing or invalid learningObjectives array")
    }

    if (!parsed.prerequisites || !Array.isArray(parsed.prerequisites)) {
      validationErrors.push("Missing or invalid prerequisites array")
    }

    // Validate each concept
    parsed.concepts?.forEach((concept: any, index: number) => {
      if (!concept.id) validationErrors.push(`Concept ${index} missing id`)
      if (!concept.name) validationErrors.push(`Concept ${index} missing name`)
      if (!concept.description)
        validationErrors.push(`Concept ${index} missing description`)
      if (!Array.isArray(concept.keyPoints))
        validationErrors.push(`Concept ${index} missing or invalid keyPoints`)
      if (!Array.isArray(concept.examples))
        validationErrors.push(`Concept ${index} missing or invalid examples`)
      if (typeof concept.importance !== "number")
        validationErrors.push(`Concept ${index} missing or invalid importance`)
      if (!concept.segmentType)
        validationErrors.push(`Concept ${index} missing segmentType`)
    })

    if (validationErrors.length > 0) {
      console.error("Content validation errors:", validationErrors)
      return null
    }

    console.log("Parsed response structure:", {
      hasStructure: !!parsed,
      hasConcepts: Array.isArray(parsed.concepts),
      conceptsLength: parsed.concepts?.length,
      hasLearningObjectives: Array.isArray(parsed.learningObjectives),
      hasPrerequisites: Array.isArray(parsed.prerequisites),
    })

    return {
      ...parsed,
      difficulty,
      segmentPlan,
    }
  } catch (error) {
    console.error("Error processing educational content:", error)
    console.error("Raw response:", response)
    return null
  }
}

const processVideoScripts = async (
  response: string,
  segmentPlan: SegmentDurationGuide[]
): Promise<VideoSegmentScript[]> => {
  try {
    const cleanedResponse = response
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/,(\s*[\]}])/g, "$1")

    const parsed = JSON.parse(cleanedResponse)
    if (!Array.isArray(parsed)) return []

    const scripts = parsed.map((script: VideoSegmentScript, index: number) => ({
      ...script,
      targetDuration: segmentPlan[index].targetDuration,
      segmentType: segmentPlan[index].type,
    }))

    // Log each script's text
    scripts.forEach((script, index) => {
      console.log(`Video script ${index + 1} (${script.segmentType}):`, {
        text: script.script.text,
        targetDuration: script.targetDuration,
        actualDuration: script.script.duration,
      })
    })

    return scripts
  } catch (error) {
    console.error("Error processing video scripts:", error)
    return []
  }
}

export const generateEducationalContent = async (
  topic: GeneratedTopic,
  difficulty: DifficultyLevel = "beginner",
  sessionDuration: SessionDuration
): Promise<GeneratedContent | null> => {
  try {
    // Calculate video structure based on session duration
    const segmentPlan = calculateSegmentPlan(sessionDuration)

    // 1. Generate educational structure
    const structurePrompt = buildEducationalContentPrompt(
      topic,
      difficulty,
      segmentPlan
    )
    const structureResult =
      await topicSuggestionModel.generateContent(structurePrompt)
    const structure = await processEducationalContent(
      structureResult.response.text(),
      difficulty,
      segmentPlan
    )

    if (!structure) {
      throw new Error("Failed to generate educational structure")
    }

    // 2. Generate video scripts based on the structure
    const scriptPrompt = buildVideoScriptPrompt(topic, structure, segmentPlan)
    const scriptResult =
      await topicSuggestionModel.generateContent(scriptPrompt)
    const videoScripts = await processVideoScripts(
      scriptResult.response.text(),
      segmentPlan
    )

    if (videoScripts.length === 0) {
      throw new Error("Failed to generate video scripts")
    }

    // 3. Create the content bundle
    const contentId = `content_${Date.now()}`
    const generatedContent: GeneratedContent = {
      id: contentId,
      topicId: topic.name,
      structure,
      videoScripts,
      metadata: {
        generatedAt: Timestamp.now(),
        difficulty,
        version: "1.0",
        sessionDuration,
        totalDuration: sessionDuration * 60,
        segmentBreakdown: {
          core: segmentPlan.filter((s) => s.type === "core").length,
          quick: segmentPlan.filter((s) => s.type === "quick").length,
          recap: segmentPlan.filter((s) => s.type === "recap").length,
        },
      },
    }

    return generatedContent
  } catch (error) {
    console.error("Error generating educational content:", error)
    return null
  }
}
