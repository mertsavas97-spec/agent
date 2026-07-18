import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space } from '@/src/theme';

/** Moodboard loading state — robot mascot + analyzing copy. */
export function AnalyzingView() {
  return (
    <View style={styles.container} testID="analyzing-view">
      <View style={styles.robot} accessibilityLabel="ÇözBil robot">
        <View style={styles.eyeRow}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.mouth} />
      </View>
      <Text style={styles.title}>Sorun analiz ediliyor...</Text>
      <ActivityIndicator color={colors.orange} style={{ marginTop: space.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  robot: {
    width: 96,
    height: 96,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  eyeRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  eye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.navy,
  },
  mouth: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.orange,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
