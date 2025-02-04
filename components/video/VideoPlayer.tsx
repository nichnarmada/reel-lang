import React from "react"
import { View, Image, StyleSheet, Dimensions } from "react-native"
import type { VideoPlayerProps } from "../../types/video"

export default function VideoPlayer({ video }: VideoPlayerProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: video.thumbnailUrl }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
})
