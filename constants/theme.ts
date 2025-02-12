export const theme = {
  colors: {
    // Primary colors
    primary: "#8A2BE2", // Bright purple
    primaryLight: "#8A2BE215", // Light purple (15% opacity)
    primaryDark: "#6B24B2", // Darker purple
    secondary: "#666666", // Secondary color for text and UI elements

    // Text colors
    text: {
      primary: "#000000",
      secondary: "#666666",
      inverse: "#FFFFFF",
    },

    // Background colors
    background: {
      primary: "#FFFFFF",
      secondary: "#F8F9FA",
      tertiary: "#F0F0F0",
    },

    // Border colors
    border: {
      light: "#F0F0F0",
      medium: "#E0E0E0",
      dark: "#C0C0C0",
      darker: "#A0A0A0",
    },

    // Status colors
    status: {
      success: "#22C55E",
      error: "#DC2626",
      warning: "#F59E0B",
      info: "#3B82F6",
    },

    // Shadow
    shadow: {
      color: "#000000",
      opacity: 0.05,
    },
  },

  // Typography
  typography: {
    sizes: {
      xs: 12,
      sm: 13,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Shadows
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 5.46,
      elevation: 3,
    },
  },
} as const

// Type for the theme
export type Theme = typeof theme
