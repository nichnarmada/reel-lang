import { useVideoPlayer, VideoView } from "expo-video"
import { View, StyleSheet, Dimensions } from "react-native"
import type { VideoPlayerProps } from "../../types/video"

export default function VideoPlayer({
  video,
  autoPlay = true,
}: VideoPlayerProps) {
  const player = useVideoPlayer(video.url, (player) => {
    if (autoPlay) {
      player.play()
    }
    player.loop = true
  })

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: Dimensions.get("window").height,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
  },
})
