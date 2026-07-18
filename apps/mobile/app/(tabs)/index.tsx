import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { pickFromCamera, pickFromLibrary } from '@/src/features/solve/image';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { brand, colors, radii, space } from '@/src/theme';

export default function HomeScreen() {
  const router = useRouter();

  async function openPicker(source: 'camera' | 'library') {
    const picked =
      source === 'camera' ? await pickFromCamera() : await pickFromLibrary();
    if (!picked) {
      Alert.alert(
        'İzin gerekli',
        source === 'camera'
          ? SAFETY_MESSAGES.permissionCamera
          : SAFETY_MESSAGES.permissionLibrary,
      );
      return;
    }
    router.push({
      pathname: '/solve',
      params: { uri: picked.uri, mimeType: picked.mimeType ?? 'image/jpeg' },
    });
  }

  function onCapture() {
    Alert.alert('Soru fotoğrafı', 'Nasıl devam edelim?', [
      { text: 'Kamera', onPress: () => void openPicker('camera') },
      { text: 'Galeri', onPress: () => void openPicker('library') },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.brand}>{brand.name}</Text>
      <Text style={styles.subtitle}>Sorunun fotoğrafını çek, adım adım çöz</Text>
      <Text style={styles.streak}>Seri: 0 gün</Text>
      <Pressable
        style={styles.cta}
        accessibilityRole="button"
        testID="capture-cta"
        onPress={onCapture}>
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
