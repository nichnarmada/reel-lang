import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
  PanResponder,
} from "react-native"
import { Library } from "lucide-react-native"
import { theme } from "../../constants/theme"
import type { MenuDrawerProps } from "./types"

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(100)).current
  const dragY = useRef(new Animated.Value(0)).current

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward drag
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose()
        } else {
          // Otherwise, snap back to original position
          Animated.spring(dragY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 100,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false)
      dragY.setValue(0)
    })
  }, [fadeAnim, slideAnim, dragY])

  const handleClose = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      animateClose()
    }
  }, [isOpen, fadeAnim, slideAnim, animateClose])

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsOpen(true)}
      >
        <Library size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={handleClose}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleClose}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: Animated.add(
                      slideAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0, 800],
                      }),
                      dragY
                    ),
                  },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
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
