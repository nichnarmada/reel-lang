import { theme } from "../../constants/theme"

export const FLOATING_MENU = {
  MAIN_BUTTON: {
    SIZE: 56,
    ICON_SIZE: 24,
    BACKGROUND_COLOR: theme.colors.primary, // Main FAB color
  },
  ACTION_BUTTON: {
    SIZE: 48,
    ICON_SIZE: 20,
    SPACING: 16, // Vertical spacing between buttons
    BACKGROUND_COLOR: theme.colors.primaryLight, // Lighter color for action items
  },
  SPACING: {
    BOTTOM: 80, // Considering tab bar height
    RIGHT: theme.spacing.lg,
  },
  ANIMATION: {
    SPRING_CONFIG: {
      damping: 15,
      mass: 1,
      stiffness: 130,
    },
    ROTATION_DEGREES: 45, // Degrees to rotate the FAB
  },
  OVERLAY: {
    BACKGROUND_COLOR: "rgba(255, 255, 255, 0.9)", // Changed to white with opacity
    ANIMATION_DURATION: 300,
  },
  LABEL: {
    MARGIN_RIGHT: 12,
    BACKGROUND_COLOR: theme.colors.background.primary,
    PADDING_VERTICAL: 8,
    PADDING_HORIZONTAL: 16,
  },
} as const
