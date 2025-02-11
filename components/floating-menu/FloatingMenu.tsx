import { Menu } from "lucide-react-native"
import React from "react"
import { StyleSheet, View, TouchableOpacity } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated"

import { ActionItem } from "./ActionItem"
import { MenuBackdrop } from "./MenuBackdrop"
import { FLOATING_MENU } from "./constants"
import type { FloatingMenuProps } from "./types"
import { theme } from "../../constants/theme"

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ actions }) => {
  const isOpen = useSharedValue(0)

  const toggleMenu = () => {
    isOpen.value = isOpen.value === 0 ? 1 : 0
  }

  const mainButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(
            `${isOpen.value * FLOATING_MENU.ANIMATION.ROTATION_DEGREES}deg`,
            FLOATING_MENU.ANIMATION.SPRING_CONFIG
          ),
        },
      ],
    }
  })

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <MenuBackdrop isOpen={isOpen} onPress={toggleMenu} />

      <View style={styles.container}>
        {actions.map((action, index) => (
          <ActionItem
            key={action.id}
            {...action}
            index={index}
            totalItems={actions.length}
            isOpen={isOpen}
          />
        ))}

        <AnimatedTouchable
          style={[styles.mainButton, mainButtonStyle]}
          onPress={toggleMenu}
        >
          <Menu
            size={FLOATING_MENU.MAIN_BUTTON.ICON_SIZE}
            color={theme.colors.text.inverse}
          />
        </AnimatedTouchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: FLOATING_MENU.SPACING.BOTTOM,
    right: FLOATING_MENU.SPACING.RIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    width: FLOATING_MENU.MAIN_BUTTON.SIZE,
    height: FLOATING_MENU.MAIN_BUTTON.SIZE,
    borderRadius: FLOATING_MENU.MAIN_BUTTON.SIZE / 2,
    backgroundColor: FLOATING_MENU.MAIN_BUTTON.BACKGROUND_COLOR,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.medium,
  },
})
