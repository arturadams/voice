import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type HeaderProps = {
  onSettingsClick: () => void;
};

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>VoiceRouter</Text>
      <TouchableOpacity onPress={onSettingsClick} style={styles.button}>
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 14,
  },
});