import { Tabs } from "expo-router"
import {
  Film,
  UserRoundPen,
  Brain,
  LineChart,
  Telescope,
} from "lucide-react-native"
import { LAYOUT } from "../../constants/layout"

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarStyle: {
          height: LAYOUT.TAB_BAR_HEIGHT,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Telescope size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => <Film size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <UserRoundPen size={24} color={color} />,
        }}
      />
    </Tabs>
  )
}
