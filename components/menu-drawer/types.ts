import { LucideIcon } from "lucide-react-native"

export interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  onPress: () => void
}

export interface MenuDrawerProps {
  items: MenuItem[]
}
