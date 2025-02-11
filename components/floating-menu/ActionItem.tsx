import React from "react"
import { StyleSheet, TouchableOpacity, Text, View } from "react-native"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"

import { FLOATING_MENU } from "./constants"
import type { ActionItemProps } from "./types"
import { theme } from "../../constants/theme"

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export const ActionItem: React.FC<ActionItemProps> = ({
  icon: Icon,
  label,
  onPress,
  index,
  totalItems,
  isOpen,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = -(
      (totalItems - index) *
      (FLOATING_MENU.ACTION_BUTTON.SIZE + FLOATING_MENU.ACTION_BUTTON.SPACING)
    )

    return {
      transform: [
        {
          scale: withSpring(
            isOpen.value,
            FLOATING_MENU.ANIMATION.SPRING_CONFIG
          ),
        },
        {
          translateY: withSpring(
            translateY * isOpen.value,
            FLOATING_MENU.ANIMATION.SPRING_CONFIG
          ),
        },
      ],
      opacity: withSpring(isOpen.value, FLOATING_MENU.ANIMATION.SPRING_CONFIG),
    }
  })

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.labelContainer}>
          <Text numberOfLines={1} style={styles.label}>
            {label}
          </Text>
        </View>
        <View style={styles.iconContainer}>
          <Icon
            size={FLOATING_MENU.ACTION_BUTTON.ICON_SIZE}
            color={theme.colors.primary}
          />
        </View>
      </View>
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 0,
    alignItems: "flex-end",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: FLOATING_MENU.ACTION_BUTTON.SIZE,
    height: FLOATING_MENU.ACTION_BUTTON.SIZE,
    borderRadius: FLOATING_MENU.ACTION_BUTTON.SIZE / 2,
    backgroundColor: FLOATING_MENU.ACTION_BUTTON.BACKGROUND_COLOR,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.medium,
  },
  labelContainer: {
    marginRight: FLOATING_MENU.LABEL.MARGIN_RIGHT,
    backgroundColor: FLOATING_MENU.LABEL.BACKGROUND_COLOR,
    borderRadius: theme.borderRadius.md,
    paddingVertical: FLOATING_MENU.LABEL.PADDING_VERTICAL,
    paddingHorizontal: FLOATING_MENU.LABEL.PADDING_HORIZONTAL,
    ...theme.shadows.small,
    maxWidth: 150,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
})
