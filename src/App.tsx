import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomBar } from './components/BottomBar';
import { ClipList } from './components/ClipList';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import type { Clip } from './models/clip';

export default function App() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  function addClip(clip: Clip) {
    setClips((prev) => [clip, ...prev]);
  }

  return (
    <View style={styles.container}>
      <Header onSettingsClick={() => setShowSettings(true)} />
      <ClipList clips={clips} />
      <BottomBar onRecorded={addClip} />
      <Footer />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
});
