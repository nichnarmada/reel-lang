import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Platform,
} from "react-native"

import { theme } from "../constants/theme"

export interface LoadingOverlayProps {
  /**
   * Optional message to display below the spinner
   */
  message?: string
  /**
   * The variant of the loading overlay
   * - fullscreen: Takes up the entire screen with a solid background
   * - inline: Renders inline with other content
   * - overlay: Semi-transparent overlay over content
   */
  variant?: "fullscreen" | "inline" | "overlay"
  /**
   * Whether to use a transparent background (only applies to overlay variant)
   */
  isTransparent?: boolean
  /**
   * Size of the loading spinner
   */
  size?: "small" | "large"
  /**
   * Whether to show the spinner (useful when you only want to show a message)
   */
  showSpinner?: boolean
  /**
   * Optional style overrides for the container
   */
  style?: ViewStyle
}

export function LoadingOverlay({
  message,
  variant = "fullscreen",
  isTransparent = false,
  size = "large",
  showSpinner = true,
  style,
}: LoadingOverlayProps) {
  const containerStyle = [
    styles.container,
    variant === "fullscreen" && styles.fullscreen,
    variant === "overlay" && styles.overlay,
    variant === "inline" && styles.inline,
    variant === "overlay" && isTransparent && styles.transparent,
    style,
  ]

  return (
    <View style={containerStyle}>
      {showSpinner && (
        <ActivityIndicator size={size} color={theme.colors.primary} />
      )}
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingTop: Platform.OS === "ios" ? 60 : theme.spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 999,
  },
  transparent: {
    backgroundColor: "transparent",
  },
  inline: {
    padding: theme.spacing.lg,
  },
  message: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
    paddingHorizontal: theme.spacing.lg,
  },
})
