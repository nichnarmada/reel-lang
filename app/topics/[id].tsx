import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { ArrowLeft } from "lucide-react-native"

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>Topic Detail: {id}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 16,
    position: "absolute",
    top: 44,
    left: 0,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 60,
  },
})
