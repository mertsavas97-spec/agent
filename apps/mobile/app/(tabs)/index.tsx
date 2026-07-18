import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';

import { BannerSlot } from '@/src/features/ads';
import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { callUpdateExamType } from '@/src/features/exam/updateExamClient';
import { pickFromCamera, pickFromLibrary } from '@/src/features/solve/image';
import { fetchAttempts, fetchProgressSummary } from '@/src/lib/api/progressClient';
import type { AttemptListItem, ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { brand, colors, radii, shadows, space, typography } from '@/src/theme';
import { topicsForExam } from '@/src/data';
import { EmptyState } from '@/src/ui/EmptyState';

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
    <View style={styles.root} testID="home-screen">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>{brand.name}</Text>
        <Text style={styles.tagline}>Sorunun fotoğrafını çek, adım adım çöz</Text>

        <ExamModeSwitcher
          value={examType}
          onChange={(e) => void onExamChange(e)}
          disabled={switching}
        />

        <View style={styles.streakRow}>
          <View style={styles.streakChip} testID="home-streak">
            <View style={styles.streakDot} />
            <Text style={styles.streakText}>
              Seri: {streak} gün
              {examType ? ` · ${EXAM_LABEL[examType]}` : ''}
            </Text>
          </View>
          <Text style={styles.topicHint}>{topicHint}</Text>
        </View>

        <View style={styles.hero}>
          <Pressable
            style={styles.cta}
            accessibilityRole="button"
            accessibilityLabel="Fotoğraf çek"
            testID="capture-cta"
            onPress={() => void openPicker('camera')}>
            <Text style={styles.ctaLabel}>Fotoğraf{'\n'}Çek</Text>
          </Pressable>
          <Text style={styles.heroCaption}>Sorunu kadraja al, saniyeler içinde çözüm</Text>

          <Pressable
            style={styles.galleryCta}
            accessibilityRole="button"
            testID="gallery-cta"
            onPress={() => void openPicker('library')}>
            <Text style={styles.galleryLabel}>Galeriden Seç</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Son çözülenler</Text>
        {loading ? (
          <ActivityIndicator color={colors.navy} />
        ) : recent.length === 0 ? (
          <EmptyState
            testID="home-recent-empty"
            title="Henüz soru yok"
            subtitle="Fotoğraf çekerek veya galeriden seçerek ilk çözümünü başlat."
          />
        ) : (
          <FlatList
            data={recent}
            keyExtractor={(item) => item.attemptId}
            testID="home-recent-list"
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.recentRow}>
                <Text style={styles.recentTopic}>{item.topicId ?? 'Konu yok'}</Text>
                <Text style={styles.recentMeta}>{item.subject}</Text>
              </View>
            )}
          />
        )}
      </ScrollView>
      <BannerSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  container: {
    padding: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  brand: {
    fontFamily: typography.fontFamily,
    fontSize: 34,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: space.lg,
    lineHeight: 22,
  },
  streakRow: {
    marginBottom: space.lg,
    gap: space.sm,
  },
  streakChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.orangeSoft,
    borderRadius: radii.pill,
    paddingHorizontal: space.md,
    paddingVertical: 8,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  streakText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  topicHint: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
  },
  hero: {
    alignItems: 'center',
    marginBottom: space.lg,
  },
  cta: {
    width: 168,
    height: 168,
    borderRadius: radii.camera,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cta,
  },
  ctaLabel: {
    fontFamily: typography.fontFamily,
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: space.sm,
  },
  heroCaption: {
    fontFamily: typography.fontFamily,
    marginTop: space.md,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  galleryCta: {
    marginTop: space.md,
    paddingVertical: 12,
    paddingHorizontal: space.xl,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.navy,
    backgroundColor: colors.white,
  },
  galleryLabel: {
    fontFamily: typography.fontFamily,
    color: colors.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    fontFamily: typography.fontFamily,
    marginTop: space.md,
    marginBottom: space.sm,
    fontWeight: '700',
    color: colors.navy,
    fontSize: 17,
  },
  recentRow: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  recentTopic: {
    fontFamily: typography.fontFamily,
    fontWeight: '600',
    color: colors.navy,
  },
  recentMeta: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
