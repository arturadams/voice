import { Audio } from 'expo-av';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Clip } from '../models/clip';

export type ClipListProps = {
  clips: Clip[];
};

export function ClipList({ clips }: ClipListProps) {
  return (
    <FlatList
      data={clips}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ClipRow clip={item} />}
      contentContainerStyle={clips.length === 0 && styles.emptyContainer}
      ListEmptyComponent={<Text style={styles.empty}>No recordings yet.</Text>}
    />
  );
}

function ClipRow({ clip }: { clip: Clip }) {
  async function play() {
    if (!clip.objectUrl) return;
    const { sound } = await Audio.Sound.createAsync({ uri: clip.objectUrl });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
    await sound.playAsync();
  }

  return (
    <TouchableOpacity onPress={play} style={styles.item}>
      <Text>{clip.title || 'Untitled note'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
  },
});
