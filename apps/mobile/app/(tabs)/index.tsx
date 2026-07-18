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
import { doc, getDoc } from 'firebase/firestore';

import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';
import { callUpdateExamType } from '@/src/features/exam/updateExamClient';
import { pickFromCamera, pickFromLibrary } from '@/src/features/solve/image';
import { fetchAttempts, fetchProgressSummary } from '@/src/lib/api/progressClient';
import type { AttemptListItem, ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { brand, colors, radii, space } from '@/src/theme';
import { topicsForExam } from '@/src/data';

export default function HomeScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [switching, setSwitching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        setLoading(true);
        try {
          const user = await ensureSignedIn();
          const { db } = getFirebase();
          const [progress, attempts, userSnap] = await Promise.all([
            fetchProgressSummary(),
            fetchAttempts({ limit: 5 }),
            getDoc(doc(db, 'users', user.uid)),
          ]);
          if (!alive) return;
          setStreak(progress.streakCount);
          setRecent(attempts.items.filter((i) => i.status === 'solved'));
          const et = userSnap.data()?.examType;
          if (et === 'lgs' || et === 'ygs' || et === 'kpss') setExamType(et);
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

  async function onExamChange(next: ExamType) {
    if (next === examType || switching) return;
    setSwitching(true);
    const previous = examType;
    setExamType(next);
    try {
      await callUpdateExamType(next);
    } catch {
      setExamType(previous);
      Alert.alert('Sınav değiştirilemedi', 'Bağlantını kontrol edip tekrar dene.');
    } finally {
      setSwitching(false);
    }
  }

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
    // Same solve pipeline for camera & gallery (upload → SafeSearch → AI).
    router.push({
      pathname: '/solve',
      params: {
        uri: picked.uri,
        mimeType: picked.mimeType ?? 'image/jpeg',
        source,
      },
    });
  }

  const topicHint =
    examType != null
      ? `${topicsForExam(examType).filter((t) => t.subject === 'math').length} matematik konu`
      : 'Sınav seç';

  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.brand}>{brand.name}</Text>
      <ExamModeSwitcher value={examType} onChange={(e) => void onExamChange(e)} disabled={switching} />
      <Text style={styles.subtitle}>Sorunun fotoğrafını çek, adım adım çöz</Text>
      <Text style={styles.streak} testID="home-streak">
        Seri: {streak} gün · {topicHint}
      </Text>
      <Pressable
        style={styles.cta}
        accessibilityRole="button"
        testID="capture-cta"
        onPress={() => void openPicker('camera')}>
        <Text style={styles.ctaLabel}>Fotoğraf Çek</Text>
      </Pressable>
      <Pressable
        style={styles.galleryCta}
        accessibilityRole="button"
        testID="gallery-cta"
        onPress={() => void openPicker('library')}>
        <Text style={styles.galleryLabel}>Galeriden Seç</Text>
      </Pressable>
      <Text style={styles.hint} testID="home-exam-hint">
        Mod: {examType ? examType.toUpperCase() : '—'} — kamera ve galeri aynı filtre/pipeline
      </Text>

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
  galleryCta: {
    marginTop: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.white,
  },
  galleryLabel: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    marginTop: space.lg,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
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
