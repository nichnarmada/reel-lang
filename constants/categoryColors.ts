interface ColorCombination {
  background: string
  text: string
}

// Pool of beautiful color combinations
export const colorPool: ColorCombination[] = [
  {
    background: "#FF6B6B15",
    text: "#FF6B6B",
  },
  {
    background: "#4ECDC415",
    text: "#4ECDC4",
  },
  {
    background: "#9D50BB15",
    text: "#9D50BB",
  },
  {
    background: "#45B7D115",
    text: "#45B7D1",
  },
  {
    background: "#96C93D15",
    text: "#96C93D",
  },
  {
    background: "#FF9A8B15",
    text: "#FF9A8B",
  },
  {
    background: "#FF85A115",
    text: "#FF85A1",
  },
  {
    background: "#45B7AF15",
    text: "#45B7AF",
  },
  {
    background: "#FFA07A15",
    text: "#FFA07A",
  },
  {
    background: "#87CEEB15",
    text: "#87CEEB",
  },
  {
    background: "#8A2BE215",
    text: "#8A2BE2",
  },
  {
    background: "#6366F115",
    text: "#6366F1",
  },
  {
    background: "#EC489915",
    text: "#EC4899",
  },
  {
    background: "#10B98115",
    text: "#10B981",
  },
  {
    background: "#F59E0B15",
    text: "#F59E0B",
  },
  {
    background: "#8B5CF615",
    text: "#8B5CF6",
  },
  {
    background: "#14B8A615",
    text: "#14B8A6",
  },
  {
    background: "#F4365915",
    text: "#F43659",
  },
  {
    background: "#3B82F615",
    text: "#3B82F6",
  },
  {
    background: "#22C55E15",
    text: "#22C55E",
  },
  {
    background: "#FB923C15",
    text: "#FB923C",
  },
  {
    background: "#06B6D415",
    text: "#06B6D4",
  },
  {
    background: "#DC264815",
    text: "#DC2648",
  },
]

// Keep track of available and used colors
class ColorManager {
  private availableColors: ColorCombination[]
  private usedColors: ColorCombination[]

  constructor() {
    this.availableColors = [...colorPool]
    this.usedColors = []
  }

  getNextColor(): ColorCombination {
    // If we've used all colors, reset
    if (this.availableColors.length === 0) {
      this.availableColors = [...this.usedColors]
      this.usedColors = []
    }

    // Get random color from available pool
    const randomIndex = Math.floor(Math.random() * this.availableColors.length)
    const selectedColor = this.availableColors[randomIndex]

    // Move color from available to used
    this.availableColors.splice(randomIndex, 1)
    this.usedColors.push(selectedColor)

    return selectedColor
  }

  reset() {
    this.availableColors = [...colorPool]
    this.usedColors = []
  }
}

// Create a singleton instance
export const colorManager = new ColorManager()

// Helper function to get consistent color for a string (if needed)
export const getConsistentColor = (key: string): ColorCombination => {
  const index = Math.abs(hashString(key)) % colorPool.length
  return colorPool[index]
}

// Simple string hashing function
const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash
}
