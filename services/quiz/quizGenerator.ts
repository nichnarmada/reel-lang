import { Timestamp } from "@react-native-firebase/firestore"

import { DifficultyLevel } from "../../types"
import {
  Question,
  Quiz,
  UserProgress,
  getQuizRequirements,
  getGenerationStrategy,
} from "../../types/quiz"
import { GeneratedTopic } from "../../types/topic"
import { topicSuggestionModel } from "../../utils/gemini/config"
import { GeneratedContent, EducationalConcept } from "../content/types"

const generateConceptQuestions = async (
  concept: EducationalConcept,
  difficulty: DifficultyLevel
): Promise<Question[]> => {
  const prompt = `Generate a multiple choice question about:
Concept: ${concept.name}
Description: ${concept.description}
Key Points: ${concept.keyPoints.join(", ")}
Difficulty: ${difficulty}

The question should test deep understanding of the concept.
Return in JSON format:
  {
  "question": "Question text here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "Correct option here",
  "explanation": "Why this is the correct answer"
}`

  console.log("Generating concept question with prompt:", {
    conceptName: concept.name,
    description: concept.description,
    keyPoints: concept.keyPoints,
    difficulty,
  })

  try {
    const response = await topicSuggestionModel.generateContent(prompt)
    const cleanedResponse = response.response
      .text()
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/,(\s*[\]}])/g, "$1")

    try {
      const parsed = JSON.parse(cleanedResponse)
      console.log("Generated concept question response:", cleanedResponse)

      return [
        {
          id: `q_${Date.now()}_${concept.id}`,
          ...parsed,
          segmentType: concept.segmentType,
          conceptId: concept.id,
        },
      ]
    } catch (parseError) {
      console.error("Failed to parse concept question JSON:", parseError)
      return []
    }
  } catch (error) {
    console.error("Error generating concept questions:", error)
    return []
  }
}

const generateKeyPointQuestions = async (
  concept: EducationalConcept,
  difficulty: DifficultyLevel
): Promise<Question[]> => {
  console.log("Generating key point question for concept:", {
    conceptName: concept.name,
    keyPoints: concept.keyPoints,
    examples: concept.examples,
    difficulty,
  })

  const prompt = `Generate a multiple choice question about ${concept.name}.

Use these key points:
${concept.keyPoints.map((point) => `- ${point}`).join("\n")}

Examples for context:
${concept.examples.map((ex) => `- ${ex}`).join("\n")}

Difficulty level: ${difficulty}

Requirements:
1. Question should test understanding of the key points
2. All options should be plausible but only one correct
3. Explanation should reference the key points
4. Match the ${difficulty} difficulty level

Return a JSON object with this exact structure (no markdown, no backticks):
{
  "question": "Clear question text here",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "Exact text of the correct option",
  "explanation": "Clear explanation why this is correct"
}`

  try {
    const response = await topicSuggestionModel.generateContent(prompt)
    const cleanedResponse = response.response
      .text()
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/,(\s*[\]}])/g, "$1")

    console.log("Generated key point question response:", cleanedResponse)

    try {
      const parsed = JSON.parse(cleanedResponse)

      // Validate the parsed response has all required fields
      if (
        !parsed.question ||
        !parsed.options ||
        !parsed.correctAnswer ||
        !parsed.explanation
      ) {
        console.error("Invalid key point question format:", parsed)
        return []
      }

      // Validate correctAnswer is one of the options
      if (!parsed.options.includes(parsed.correctAnswer)) {
        console.error(
          "Key point question correct answer not in options:",
          parsed
        )
        return []
      }

      return [
        {
          id: `q_${Date.now()}_${concept.id}`,
          ...parsed,
          segmentType: concept.segmentType,
          conceptId: concept.id,
        },
      ]
    } catch (parseError) {
      console.error("Failed to parse key point question JSON:", parseError)
      return []
    }
  } catch (error) {
    console.error("Error generating key point questions:", error)
    return []
  }
}

const generateRecapQuestions = async (
  concept: EducationalConcept,
  allConcepts: EducationalConcept[],
  difficulty: DifficultyLevel
): Promise<Question[]> => {
  const relatedConcepts = allConcepts
    .filter((c) => c.id !== concept.id)
    .map((c) => ({
      name: c.name,
      keyPoints: c.keyPoints,
    }))

  console.log("Generating recap question for concept:", {
    mainConcept: concept.name,
    keyPoints: concept.keyPoints,
    relatedConcepts: relatedConcepts.map((c) => c.name),
    difficulty,
  })

  const prompt = `Generate a multiple choice question that connects:
Main Concept: ${concept.name}
Key Points: ${concept.keyPoints.join(", ")}
Related Concepts: ${JSON.stringify(relatedConcepts)}
Difficulty: ${difficulty}

The question should test understanding of relationships between concepts.
Return in JSON format:
{
  "question": "Question text here",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "Correct option here",
  "explanation": "Why this is the correct answer"
}`

  try {
    const response = await topicSuggestionModel.generateContent(prompt)
    const cleanedResponse = response.response
      .text()
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/,(\s*[\]}])/g, "$1")

    console.log("Generated recap question response:", cleanedResponse)

    try {
      const parsed = JSON.parse(cleanedResponse)
      return [
        {
          id: `q_${Date.now()}_${concept.id}`,
          ...parsed,
          segmentType: concept.segmentType,
          conceptId: concept.id,
        },
      ]
    } catch (parseError) {
      console.error("Failed to parse recap question JSON:", parseError)
      return []
    }
  } catch (error) {
    console.error("Error generating recap questions:", error)
    return []
  }
}

export const createQuiz = async (
  userId: string,
  sessionId: string,
  topic: GeneratedTopic,
  content: GeneratedContent,
  userProgress: UserProgress
): Promise<Quiz | null> => {
  try {
    const questions: Question[] = []
    const difficulty = content.metadata.difficulty
    const duration = content.metadata.sessionDuration
    const requirements = getQuizRequirements(duration)
    const strategy = getGenerationStrategy(duration)

    console.log("Starting quiz generation with content:", {
      concepts: content.structure.concepts.length,
      difficulty,
      duration,
      requirements,
      strategy,
      topicName: topic.name,
      conceptTypes: content.structure.concepts.map((c) => ({
        name: c.name,
        type: c.segmentType,
        keyPointsCount: c.keyPoints.length,
        examplesCount: c.examples.length,
      })),
    })

    // Generate questions based on segment types and strategy
    for (const concept of content.structure.concepts) {
      console.log(`\nProcessing concept: ${concept.name}`)
      console.log("Concept details:", {
        type: concept.segmentType,
        keyPoints: concept.keyPoints,
        examples: concept.examples,
        description: concept.description,
        targetQuestions: strategy[concept.segmentType],
      })

      const conceptQuestions: Question[] = []
      const targetQuestionCount = strategy[concept.segmentType]

      // Skip if strategy indicates 0 questions for this type
      if (targetQuestionCount === 0) {
        console.log(`Skipping ${concept.segmentType} concept as per strategy`)
        continue
      }

      // Generate questions based on segment type
      for (let i = 0; i < targetQuestionCount; i++) {
        let questionBatch: Question[] = []

        switch (concept.segmentType) {
          case "core":
            console.log(
              `Generating core concept question ${
                i + 1
              }/${targetQuestionCount}...`
            )
            questionBatch = await generateConceptQuestions(concept, difficulty)
            break
          case "quick":
            console.log(
              `Generating quick key point question ${
                i + 1
              }/${targetQuestionCount}...`
            )
            questionBatch = await generateKeyPointQuestions(concept, difficulty)
            break
          case "recap":
            console.log(
              `Generating recap question ${i + 1}/${targetQuestionCount}...`
            )
            questionBatch = await generateRecapQuestions(
              concept,
              content.structure.concepts,
              difficulty
            )
            break
        }

        // Take one question from the batch
        if (questionBatch.length > 0) {
          conceptQuestions.push(questionBatch[0])
        }
      }

      console.log(
        `Generated ${conceptQuestions.length}/${targetQuestionCount} questions for concept: ${concept.name}`
      )
      if (conceptQuestions.length === 0) {
        console.log(
          "Warning: No questions generated for this concept. Response may be malformed."
        )
      }
      questions.push(...conceptQuestions)
    }

    console.log("\nQuiz generation summary:", {
      totalQuestions: questions.length,
      questionsByType: questions.reduce(
        (acc, q) => {
          acc[q.segmentType || "unknown"] =
            (acc[q.segmentType || "unknown"] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
      minRequired: requirements.minQuestions,
      maxAllowed: requirements.maxQuestions,
    })

    // Check if we have enough questions
    if (questions.length < requirements.minQuestions) {
      console.log(
        `\nAttempting to generate additional questions to meet minimum requirement of ${requirements.minQuestions}...`
      )

      // Try to generate more questions from concepts that successfully generated questions before
      const successfulConcepts = content.structure.concepts.filter(
        (concept) => {
          const existingQuestions = questions.filter(
            (q) => q.conceptId === concept.id
          )
          return existingQuestions.length > 0
        }
      )

      for (const concept of successfulConcepts) {
        if (questions.length >= requirements.minQuestions) break

        console.log(
          `Generating additional question for concept: ${concept.name}`
        )

        let additionalQuestions: Question[] = []
        switch (concept.segmentType) {
          case "core":
            additionalQuestions = await generateConceptQuestions(
              concept,
              difficulty
            )
            break
          case "quick":
            additionalQuestions = await generateKeyPointQuestions(
              concept,
              difficulty
            )
            break
          case "recap":
            additionalQuestions = await generateRecapQuestions(
              concept,
              content.structure.concepts,
              difficulty
            )
            break
        }

        if (additionalQuestions.length > 0) {
          questions.push(additionalQuestions[0])
          console.log("Successfully generated additional question")
        }
      }
    }

    // If we still don't have enough questions, log error but continue
    if (questions.length < requirements.minQuestions) {
      console.error("Warning: Could not generate minimum required questions:", {
        generated: questions.length,
        required: requirements.minQuestions,
      })
    }

    // Trim excess questions if we generated too many
    if (questions.length > requirements.maxQuestions) {
      console.log(
        `Trimming excess questions to maximum of ${requirements.maxQuestions}`
      )
      questions.length = requirements.maxQuestions
    }

    const quizId = `${sessionId}_quiz`
    const quiz: Quiz = {
      id: quizId,
      sessionId,
      userId,
      questions,
      userResponses: [],
      metadata: {
        generatedAt: Timestamp.now(),
        difficulty,
        topics: [topic.name],
        segmentBreakdown: {
          core: questions.filter((q) => q.segmentType === "core").length,
          quick: questions.filter((q) => q.segmentType === "quick").length,
          recap: questions.filter((q) => q.segmentType === "recap").length,
        },
        userProgress,
      },
    }

    return quiz
  } catch (error) {
    console.error("Error in createQuiz:", error)
    throw error
  }
}
