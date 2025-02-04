import React from "react"
import { View, FlatList, StyleSheet, Dimensions } from "react-native"
import { useVideoFeed } from "../../hooks/useVideoFeed"
import VideoPlayer from "../../components/video/VideoPlayer"
import { useCallback } from "react"
import type { Video } from "../../types/video"
import FirestoreTest from "../../components/debug/FirestoreTest"

export default function FeedScreen() {
  const { videos, loading, error, loadVideos, hasMore, refresh } =
    useVideoFeed()

  const renderVideo = useCallback(
    ({ item: video }: { item: Video }) => (
      <View style={styles.videoContainer}>
        <VideoPlayer video={video} />
      </View>
    ),
    []
  )

  return (
    <React.Fragment>
      <FirestoreTest />
      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={Dimensions.get("window").height}
        snapToAlignment="start"
        decelerationRate="fast"
        onEndReached={() => hasMore && loadVideos()}
        onEndReachedThreshold={0.5}
        onRefresh={refresh}
        refreshing={loading}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />
    </React.Fragment>
  )
}

const styles = StyleSheet.create({
  videoContainer: {
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
  },
})
