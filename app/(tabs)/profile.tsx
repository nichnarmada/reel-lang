import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Platform,
} from "react-native"
import { useAuth } from "../../contexts/auth"
import {
  Settings,
  Bell,
  BookOpen,
  Share2,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react-native"
import { HEADER_PADDING } from "../../constants/layout"

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true)
  const [autoplayEnabled, setAutoplayEnabled] = React.useState(true)

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
        <Text style={styles.sectionTitle}>Learning Preferences</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <BookOpen size={24} color="#666" />
            <Text style={styles.settingText}>Topics of Interest</Text>
          </View>
          <ChevronRight size={20} color="#666" />
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Bell size={24} color="#666" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={notificationsEnabled ? "#2196f3" : "#f4f3f4"}
          />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Settings size={24} color="#666" />
            <Text style={styles.settingText}>Autoplay Videos</Text>
          </View>
          <Switch
            value={autoplayEnabled}
            onValueChange={setAutoplayEnabled}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={autoplayEnabled ? "#2196f3" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* Support & About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & About</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Share2 size={24} color="#666" />
            <Text style={styles.settingText}>Share App</Text>
          </View>
          <ChevronRight size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <HelpCircle size={24} color="#666" />
            <Text style={styles.settingText}>Help & Support</Text>
          </View>
          <ChevronRight size={20} color="#666" />
        </TouchableOpacity>
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
    backgroundColor: "#fff",
    ...HEADER_PADDING,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  button: {
    margin: 20,
    padding: 16,
    backgroundColor: "#ff4444",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
})
