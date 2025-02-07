import { Tabs } from "expo-router"
import {
  Film,
  UserRoundPen,
  Telescope,
  ChartNoAxesCombined,
  GraduationCap,
} from "lucide-react-native"
import { LAYOUT } from "../../constants/layout"
import { theme } from "../../constants/theme"

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
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
        name="learning"
        options={{
          title: "Learning",
          tabBarIcon: ({ color }) => <GraduationCap size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <ChartNoAxesCombined size={24} color={color} />
          ),
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
