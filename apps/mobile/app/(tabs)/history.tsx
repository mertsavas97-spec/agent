import { StyleSheet, Text, View } from 'react-native';

import { colors, space } from '@/src/theme';

export default function HistoryScreen() {
  return (
    <View style={styles.container} testID="history-screen">
      <Text style={styles.title}>Geçmiş</Text>
      <Text style={styles.empty}>Henüz çözülmüş soru yok</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: space.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.md,
  },
  empty: {
    color: colors.textSecondary,
  },
});
