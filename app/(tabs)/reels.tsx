import React, { useEffect } from "react"
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  Platform,
} from "react-native"
import { useVideoFeed } from "../../hooks/useVideoFeed"
import VideoPlayer from "../../components/video/VideoPlayer"
import type { Video } from "../../types/video"
import { LAYOUT } from "../../constants/layout"

export default function FeedScreen() {
  const { videos, loading, error, loadVideos, hasMore, refresh } =
    useVideoFeed()

  // Load videos when component mounts
  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  const renderVideo = ({ item: video }: { item: Video }) => (
    <View style={styles.itemContainer}>
      <VideoPlayer video={video} />
    </View>
  )

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading videos</Text>
      </View>
    )
  }

  if (loading && !videos.length) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  console.log({
    height:
      Dimensions.get("window").height -
      (LAYOUT.TAB_BAR_HEIGHT + LAYOUT.STATUS_BAR_HEIGHT),
  })

  return (
    <FlatList
      data={videos}
      renderItem={renderVideo}
      keyExtractor={(item) => item.id}
      pagingEnabled
      snapToInterval={Dimensions.get("window").height}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onEndReached={() => hasMore && loadVideos()}
      onEndReachedThreshold={0.5}
      onRefresh={refresh}
      refreshing={loading}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
      }}
    />
  )
}

const styles = StyleSheet.create({
  itemContainer: {
    height: LAYOUT.VIDEO_CONTAINER_HEIGHT,
    width: Dimensions.get("window").width,
    marginTop: Platform.OS === "ios" ? 60 : 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
})
