import { Audio } from 'expo-av';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Clip } from '../models/clip';

type RecorderControlsProps = {
  onRecorded: (clip: Clip) => void;
};

export function RecorderControls({ onRecorded }: RecorderControlsProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    } catch (e) {
      console.error(e);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    const clip: Clip = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      mimeType: 'audio/m4a',
      status: 'saved',
      objectUrl: uri || undefined,
      duration: status.durationMillis ? status.durationMillis / 1000 : undefined,
    };
    onRecorded(clip);
    setRecording(null);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={recording ? stopRecording : startRecording}
        style={[styles.button, recording && styles.buttonActive]}
      >
        <Text style={styles.buttonText}>{recording ? 'Stop' : 'Record'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  buttonActive: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
