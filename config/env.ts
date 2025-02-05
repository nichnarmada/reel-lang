import Constants from "expo-constants"

type EnvVariables = {
  PEXELS_API_KEY: string | undefined
}

// Access environment variables from app.config.js or .env
const ENV: EnvVariables = {
  PEXELS_API_KEY:
    Constants.expoConfig?.extra?.pexelsApiKey ?? process.env.PEXELS_API_KEY,
}

// Validate that all required environment variables are present
const _validateEnv = () => {
  const requiredVars: (keyof EnvVariables)[] = ["PEXELS_API_KEY"]
  for (const v of requiredVars) {
    if (!ENV[v]) {
      throw new Error(`Missing required environment variable: ${v}`)
    }
  }
}

// Validate environment variables in development
if (__DEV__) {
  _validateEnv()
}

export default ENV
