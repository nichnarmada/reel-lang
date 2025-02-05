import React from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Dimensions,
} from "react-native"
import { Stack, router } from "expo-router"
import { ChevronLeft, Play } from "lucide-react-native"
import { useSavedVideos } from "../hooks/useSavedVideos"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ErrorMessage } from "../components/ErrorMessage"
import { SavedVideo } from "../types/user"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const COLUMN_COUNT = 3
const GRID_PADDING = 2
const ITEM_SPACING = 2
const ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_PADDING * 2 - ITEM_SPACING * (COLUMN_COUNT - 1)) /
  COLUMN_COUNT
const ITEM_HEIGHT = ITEM_WIDTH * 1.777 // 16:9 aspect ratio

export default function SavedVideosScreen() {
  const { videos, loading, error } = useSavedVideos()

  const renderVideo = ({ item }: { item: SavedVideo }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => {
        router.push({
          pathname: "/saved-videos/[id]" as const,
          params: { id: item.id },
        })
      }}
    >
      <ImageBackground
        source={{ uri: item.thumbnail }}
        style={styles.thumbnail}
        imageStyle={styles.thumbnailImage}
      >
        <View style={styles.playButtonContainer}>
          <View style={styles.playButton}>
            <Play size={16} color="#fff" />
          </View>
        </View>
        <View style={styles.topicBadgeContainer}>
          <View style={styles.topicBadge}>
            <Text style={styles.topicText} numberOfLines={1}>
              {item.topicName}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading saved videos...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Videos</Text>
        </View>

        {videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You haven't saved any videos yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Videos you save will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={videos}
            renderItem={renderVideo}
            keyExtractor={(item) => item.id}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingTop: Platform.OS === "ios" ? 60 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 8,
    color: "#000",
  },
  gridContainer: {
    padding: GRID_PADDING,
  },
  row: {
    justifyContent: "flex-start",
    gap: ITEM_SPACING,
  },
  videoCard: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginBottom: ITEM_SPACING,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailImage: {
    borderRadius: 8,
  },
  playButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  topicBadgeContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
  },
  topicBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: "100%",
  },
  topicText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
})
