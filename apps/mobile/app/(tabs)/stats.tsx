import { StyleSheet, Text, View } from 'react-native';

import { colors, space } from '@/src/theme';

export default function StatsScreen() {
  return (
    <View style={styles.container} testID="stats-screen">
      <Text style={styles.title}>İstatistik</Text>
      <Text style={styles.empty}>İlerleme verisi henüz yok</Text>
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
