import React from "react"
import { StyleSheet, TouchableWithoutFeedback } from "react-native"
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated"

import { FLOATING_MENU } from "./constants"

interface MenuBackdropProps {
  isOpen: Animated.SharedValue<number>
  onPress: () => void
}

export const MenuBackdrop: React.FC<MenuBackdropProps> = ({
  isOpen,
  onPress,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.value, {
      duration: FLOATING_MENU.OVERLAY.ANIMATION_DURATION,
    }),
    pointerEvents: isOpen.value === 0 ? "none" : ("auto" as const),
  }))

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View style={[styles.backdrop, animatedStyle]} />
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FLOATING_MENU.OVERLAY.BACKGROUND_COLOR,
  },
})
