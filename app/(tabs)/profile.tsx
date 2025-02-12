import { useRouter } from "expo-router"
import { Film, ChevronRight, Brain } from "lucide-react-native"
import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from "react-native"

import { HEADER_PADDING } from "../../constants/layout"
import { theme } from "../../constants/theme"
import { useAuth } from "../../contexts/auth"

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [autoplayEnabled, setAutoplayEnabled] = React.useState(true)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: user?.photoURL || "https://via.placeholder.com/100" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.displayName || "Learner"}</Text>
      </View>

      {/* Learning Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Settings</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push("/(profile)/topics-of-interest")}
        >
          <View style={styles.settingLeft}>
            <Brain size={24} color={theme.colors.text.secondary} />
            <Text style={styles.settingText}>Manage Topics</Text>
          </View>
          <ChevronRight size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Film size={24} color={theme.colors.text.secondary} />
            <Text style={styles.settingText}>Autoplay Videos</Text>
          </View>
          <Switch
            value={autoplayEnabled}
            onValueChange={setAutoplayEnabled}
            trackColor={{ false: "#767577", true: theme.colors.primaryLight }}
            thumbColor={autoplayEnabled ? theme.colors.primary : "#f4f3f4"}
          />
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    ...HEADER_PADDING,
  },
  header: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
  email: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
  button: {
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.status.error,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: theme.typography.sizes.md,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
})
