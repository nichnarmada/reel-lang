import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native"
import { router } from "expo-router"
import { useTopics } from "../../contexts/topics"
import { LoadingSpinner } from "../../components/LoadingSpinner"
import { ErrorMessage } from "../../components/ErrorMessage"
import { Search } from "lucide-react-native"

export default function DiscoverScreen() {
  const {
    topics,
    featuredTopics,
    topicPaths,
    userPreferences,
    loading,
    error,
    selectTopic,
    unselectTopic,
    refreshTopics,
  } = useTopics()

  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleTopic = async (topicId: string) => {
    const isSelected = userPreferences?.selectedTopics.some(
      (topic) => topic.topicId === topicId
    )
    if (isSelected) {
      await unselectTopic(topicId)
    } else {
      await selectTopic(topicId)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await refreshTopics()
    setRefreshing(false)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover Topics</Text>
          <Text style={styles.subtitle}>Select topics that interest you</Text>
        </View>

        {/* Add Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Featured Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Topics</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featuredTopics}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => router.push(`/topics/${item.id}`)}
              >
                <Text style={styles.topicIcon}>{item.icon}</Text>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.description}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>

        {/* All Topics Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Topics</Text>
          <View style={styles.topicsGrid}>
            {filteredTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicCard,
                  userPreferences?.selectedTopics.some(
                    (t) => t.topicId === topic.id
                  ) && styles.selectedTopic,
                ]}
                onPress={() => toggleTopic(topic.id)}
              >
                <Text style={styles.topicIcon}>{topic.icon}</Text>
                <Text style={styles.topicName}>{topic.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Learning Paths */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Learning Paths</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={topicPaths}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.pathCard}>
                <Text style={styles.pathTitle}>{item.name}</Text>
                <Text style={styles.pathDetails}>
                  {item.videoCount} videos • {item.quizCount} quizzes
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => `path-${item.id}`}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 60 : 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  featuredCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  topicCard: {
    width: "48%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  selectedTopic: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 1,
  },
  topicIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  topicName: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  pathCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  pathDetails: {
    fontSize: 12,
    color: "#666",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
})
