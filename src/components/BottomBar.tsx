import { StyleSheet, View } from 'react-native';
import type { Clip } from '../models/clip';
import { RecorderControls } from './RecorderControls';

type BottomBarProps = {
  onRecorded: (clip: Clip) => void;
};

export function BottomBar({ onRecorded }: BottomBarProps) {
  return (
    <View style={styles.container}>
      <RecorderControls onRecorded={onRecorded} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
