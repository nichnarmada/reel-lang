import { Timestamp } from "@react-native-firebase/firestore"
import { GeneratedTopic } from "../../types/topic"
import { Question, Quiz, QuizMetadata } from "../../types/quiz"
import { topicSuggestionModel } from "../../utils/gemini/config"
import { firestore } from "../../utils/firebase/config"
import { doc, setDoc } from "@react-native-firebase/firestore"

const buildQuizPrompt = (
  topic: GeneratedTopic,
  difficulty: "beginner" | "intermediate" | "advanced"
): string => {
  return `Generate quiz questions for the following topic:
Topic: ${topic.name}
Description: ${topic.description}
Difficulty Level: ${difficulty}
Key Terms: ${topic.searchTerms.join(", ")}

Please generate questions in the following JSON format:
[
  {
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 1",
    "explanation": "Brief explanation of why this is correct"
  }
]

Requirements:
1. Generate 5 multiple-choice questions
2. Each question should have exactly 4 options
3. Questions should match the specified difficulty level
4. Include clear, concise explanations
5. Ensure all options are plausible
6. Format as a valid JSON array
7. Questions should test understanding, not just memorization
8. Include a mix of concept-based and application-based questions
9. The correctAnswer MUST be exactly one of the options provided

Return only the JSON array, no additional text or formatting.`
}

interface QuizGenerationResult {
  success: boolean
  error?: string
  questions: Question[]
}

const processQuizResponse = async (
  response: string,
  topicId: string
): Promise<Question[]> => {
  try {
    const cleanedResponse = response
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/,(\s*[\]}])/g, "$1")

    const parsed = JSON.parse(cleanedResponse)

    if (!Array.isArray(parsed)) {
      console.warn("AI response is not an array:", parsed)
      return []
    }

    // Validate and format each question
    return parsed.map((item: any) => {
      // Ensure correctAnswer is one of the options
      if (!item.options.includes(item.correctAnswer)) {
        console.warn("Correct answer not in options:", item)
        // Use the first option as fallback
        item.correctAnswer = item.options[0]
      }

      return {
        question: item.question,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        topicId,
        videoReference: "", // Empty for now since we're not using videos yet
      }
    })
  } catch (error) {
    console.error("Error processing quiz response:", error)
    console.error("Raw response:", response)
    return []
  }
}

const generateQuizQuestions = async (
  topic: GeneratedTopic,
  difficulty: "beginner" | "intermediate" | "advanced"
): Promise<QuizGenerationResult> => {
  try {
    const prompt = buildQuizPrompt(topic, difficulty)
    const result = await topicSuggestionModel.generateContent(prompt)
    const response = result.response.text()
    const questions = await processQuizResponse(response, topic.name)

    if (questions.length === 0) {
      return {
        success: false,
        error: "No questions were generated",
        questions: [],
      }
    }

    return {
      success: true,
      questions,
    }
  } catch (error) {
    console.error(`Error generating quiz for topic ${topic.name}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      questions: [],
    }
  }
}

export const createQuiz = async (
  userId: string,
  sessionId: string,
  topic: GeneratedTopic,
  difficulty: "beginner" | "intermediate" | "advanced"
): Promise<Quiz | null> => {
  try {
    const { success, questions, error } = await generateQuizQuestions(
      topic,
      difficulty
    )

    if (!success || questions.length === 0) {
      console.error("Failed to generate quiz:", error)
      return null
    }

    const quizId = `quiz_${Date.now()}`
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
      },
    }

    // Store the quiz in Firestore
    const quizRef = doc(firestore, "quizzes", quizId)
    await setDoc(quizRef, quiz)

    return quiz
  } catch (error) {
    console.error("Error creating quiz:", error)
    return null
  }
}
