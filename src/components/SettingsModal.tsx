import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SettingsModalProps = {
  visible: boolean;
  onClose(): void;
};

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Settings</Text>
          <Text>Coming soon…</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  button: {
    marginTop: 20,
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: '#2563eb',
  },
});
