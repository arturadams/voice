import { StyleSheet, Text, View } from 'react-native';

export function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Built with ❤️ — works on iOS, Android, and web.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    color: '#666',
  },
});
