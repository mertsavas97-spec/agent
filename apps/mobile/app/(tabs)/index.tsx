import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { pickFromCamera, pickFromLibrary } from '@/src/features/solve/image';
import { fetchAttempts, fetchProgressSummary } from '@/src/lib/api/progressClient';
import type { AttemptListItem } from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { brand, colors, radii, space } from '@/src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        setLoading(true);
        try {
          const [progress, attempts] = await Promise.all([
            fetchProgressSummary(),
            fetchAttempts({ limit: 5 }),
          ]);
          if (!alive) return;
          setStreak(progress.streakCount);
          setRecent(attempts.items.filter((i) => i.status === 'solved'));
        } catch {
          if (!alive) return;
          setStreak(0);
          setRecent([]);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

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
      <Text style={styles.streak} testID="home-streak">
        Seri: {streak} gün
      </Text>
      <Pressable
        style={styles.cta}
        accessibilityRole="button"
        testID="capture-cta"
        onPress={onCapture}>
        <Text style={styles.ctaLabel}>Fotoğraf Çek</Text>
      </Pressable>
      <Text style={styles.hint}>LGS · YGS · KPSS</Text>

      <Text style={styles.section}>Son çözülenler</Text>
      {loading ? (
        <ActivityIndicator color={colors.navy} />
      ) : recent.length === 0 ? (
        <Text style={styles.empty} testID="home-recent-empty">
          Henüz soru yok — fotoğraf çekerek başla
        </Text>
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(item) => item.attemptId}
          testID="home-recent-list"
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.recentRow}>
              <Text style={styles.recentTopic}>{item.topicId ?? 'Konu yok'}</Text>
              <Text style={styles.recentMeta}>{item.subject}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: space.lg,
    paddingTop: space.xl,
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
  section: {
    alignSelf: 'stretch',
    marginTop: space.xl,
    marginBottom: space.sm,
    fontWeight: '700',
    color: colors.navy,
    fontSize: 16,
  },
  empty: { alignSelf: 'stretch', color: colors.textSecondary },
  list: { alignSelf: 'stretch', maxHeight: 180 },
  recentRow: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentTopic: { fontWeight: '600', color: colors.navy },
  recentMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
