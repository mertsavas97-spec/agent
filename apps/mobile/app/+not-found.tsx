import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa yok' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Bu ekran bulunamadı</Text>
        <Text style={styles.body}>Ana sayfaya dönüp soru çözmeye devam edebilirsin.</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Ana sayfaya dön</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 20,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    textAlign: 'center',
  },
  body: {
    marginTop: space.sm,
    fontSize: 14,
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  link: {
    marginTop: space.lg,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    backgroundColor: colors.navy,
    borderRadius: radii.md,
  },
  linkText: {
    fontSize: 15,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.white,
  },
});
