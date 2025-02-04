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
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: user?.photoURL || "https://via.placeholder.com/100" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.displayName || "Learner"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
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
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={24} color="#ff4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  email: {
    fontSize: 16,
    color: "#666",
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
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    margin: 20,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#ff4444",
    fontWeight: "600",
  },
})
