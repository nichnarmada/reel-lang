import { View, Text, StyleSheet } from "react-native"
import { useAuth } from "../../contexts/auth"

export default function ProfileScreen() {
  const { user } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.email}>{user?.email}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
})
