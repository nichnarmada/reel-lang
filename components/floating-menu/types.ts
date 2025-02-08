import { LucideIcon } from "lucide-react-native"
import type Animated from "react-native-reanimated"

export interface ActionItem {
  id: string
  label: string
  icon: LucideIcon
  onPress: () => void
  count?: number
}

export interface FloatingMenuProps {
  actions: ActionItem[]
}

export interface ActionItemProps extends ActionItem {
  index: number
  totalItems: number
  isOpen: Animated.SharedValue<number>
}
