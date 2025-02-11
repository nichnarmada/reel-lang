import { Library } from "lucide-react-native"
import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  runOnJS,
} from "react-native-reanimated"

import type { MenuDrawerProps } from "./types"
import { theme } from "../../constants/theme"

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const fadeAnim = useSharedValue(0)
  const slideAnim = useSharedValue(100)
  const dragY = useSharedValue(0)

  const gesture = Gesture.Pan()
    .onBegin(() => {
      "worklet"
      dragY.value = 0
    })
    .onUpdate((event) => {
      "worklet"
      if (event.translationY > 0) {
        dragY.value = event.translationY
      }
    })
    .onEnd((event) => {
      "worklet"
      if (event.translationY > 100) {
        runOnJS(handleClose)()
      } else {
        dragY.value = withSpring(0, {
          damping: 15,
          stiffness: 90,
        })
      }
    })

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }))

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          interpolate(slideAnim.value, [0, 100], [0, 800]) + dragY.value,
      },
    ],
  }))

  const animateClose = useCallback(() => {
    fadeAnim.value = withTiming(0, { duration: 200 })
    slideAnim.value = withSpring(
      100,
      {
        damping: 15,
        stiffness: 90,
      },
      (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false)
          dragY.value = 0
        }
      }
    )
  }, [])

  const handleClose = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true)
      fadeAnim.value = withTiming(1, { duration: 200 })
      slideAnim.value = withSpring(0, {
        damping: 15,
        stiffness: 90,
      })
    } else {
      animateClose()
    }
  }, [isOpen])

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsOpen(true)}
      >
        <Library size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent onRequestClose={handleClose}>
        <Animated.View style={[styles.modalContainer, overlayStyle]}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleClose}
          />
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.modalContent, contentStyle]}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Menu</Text>
              </View>

              <View style={styles.menuItems}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => {
                      handleClose()
                      item.onPress()
                    }}
                  >
                    <item.icon size={20} color={theme.colors.text.secondary} />
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  menuButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : theme.spacing.xl,
  },
  dragHandleContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border.dark,
    borderRadius: theme.borderRadius.full,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  menuItems: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  menuItemText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
})
