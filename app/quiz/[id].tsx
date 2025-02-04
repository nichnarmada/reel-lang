import { View, Text } from "react-native"
import { useLocalSearchParams } from "expo-router"

export default function QuizDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <View>
      <Text>Quiz Detail: {id}</Text>
    </View>
  )
}
