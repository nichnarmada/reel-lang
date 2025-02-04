import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native"
import { useLocalSearchParams, router } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import { useTopics } from "../../contexts/topics"
import { ErrorMessage } from "../../components/ErrorMessage"

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { topics, userPreferences } = useTopics()
  const topic = topics.find((t) => t.id === id)

  console.log("topic", topic, id)

  if (!topic) return <ErrorMessage message="Topic not found" />

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.icon}>{topic.icon}</Text>
        <Text style={styles.title}>{topic.name}</Text>
        <Text style={styles.description}>{topic.description}</Text>
      </View>

      {/* Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.progressStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{topic.videoCount}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Quizzes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Mastery</Text>
          </View>
        </View>
      </View>

      {/* Videos Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Videos</Text>
        {/* Add video list component */}
      </View>

      {/* Related Topics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Related Topics</Text>
        <View style={styles.relatedTopics}>
          {topic.relatedTopics.map((relatedId) => {
            const relatedTopic = topics.find((t) => t.id === relatedId)
            if (!relatedTopic) return null

            return (
              <TouchableOpacity
                key={relatedId}
                style={styles.relatedTopicCard}
                onPress={() => router.push(`/topics/${relatedId}`)}
              >
                <Text style={styles.relatedTopicIcon}>{relatedTopic.icon}</Text>
                <Text style={styles.relatedTopicName}>{relatedTopic.name}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ScrollView>
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
    top: 60,
    left: 0,
    zIndex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 100,
    marginBottom: 20,
    alignItems: "center",
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  relatedTopics: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  relatedTopicCard: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    margin: 4,
  },
  relatedTopicIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  relatedTopicName: {
    fontSize: 16,
    marginTop: 4,
  },
})
