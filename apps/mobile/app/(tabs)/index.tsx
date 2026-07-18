import { StyleSheet, Text, View, Pressable } from 'react-native';

import { brand, colors, radii, space } from '@/src/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.brand}>{brand.name}</Text>
      <Text style={styles.subtitle}>Sorunun fotoğrafını çek, adım adım çöz</Text>
      <Text style={styles.streak}>Seri: 0 gün</Text>
      <Pressable style={styles.cta} accessibilityRole="button" testID="capture-cta">
        <Text style={styles.ctaLabel}>Fotoğraf Çek</Text>
      </Pressable>
      <Text style={styles.hint}>LGS · YGS · KPSS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: space.lg,
  },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: space.lg,
  },
  streak: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: space.xl,
  },
  cta: {
    width: 160,
    height: 160,
    borderRadius: radii.camera,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: space.sm,
  },
  hint: {
    marginTop: space.xl,
    color: colors.textSecondary,
    fontSize: 13,
  },
});
