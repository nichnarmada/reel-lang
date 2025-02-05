import Constants from "expo-constants"
import { Platform } from "react-native"

export const LAYOUT = {
  STATUS_BAR_HEIGHT: Constants.statusBarHeight,
  TAB_BAR_HEIGHT: 70,
} as const

export const HEADER_PADDING = {
  paddingTop: Platform.OS === "ios" ? 60 : 20,
}
