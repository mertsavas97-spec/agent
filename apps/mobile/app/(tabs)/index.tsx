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
            fetchProgressSummary().catch(() => ({ streakCount: 0 })),
            fetchAttempts({ limit: 5 }).catch(() => ({ items: [] as AttemptListItem[] })),
            getDoc(doc(db, 'users', user.uid)),
          ]);
          if (!alive) return;
          setStreak(progress.streakCount ?? 0);
          setRecent((attempts.items ?? []).filter((i) => i.status === 'solved'));
          const et = userSnap.data()?.examType;
          if (et === 'lgs' || et === 'ygs' || et === 'kpss') {
            setExamType(et);
          } else {
            // Ensure a visible selected exam (bootstrap default).
            setExamType('lgs');
            void callUpdateExamType('lgs').catch(() => undefined);
          }
        } catch {
          if (!alive) return;
          setStreak(0);
          setRecent([]);
          setExamType((prev) => prev ?? 'lgs');
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
    if (!examType) {
      Alert.alert('Önce sınav seç', 'LGS, YGS veya KPSS seçmeden soru gönderilemez.');
      return;
    }
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

  const mathCount =
    examType != null ? topicsForExam(examType).filter((t) => t.subject === 'math').length : 0;

  return (
    <View style={styles.root} testID="home-screen">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>{brand.name}</Text>
        <Text style={styles.tagline}>
          Kitaptaki veya defterdeki sorunun fotoğrafını çek, adım adım anlatılsın.
        </Text>

        <ExamModeSwitcher
          value={examType}
          onChange={(e) => void onExamChange(e)}
          disabled={switching}
        />

        {examType ? (
          <Text style={styles.metaLine} testID="home-streak">
            Seri: {streak} gün · {EXAM_LABEL[examType]} · {mathCount} matematik konusu
          </Text>
        ) : (
          <Text style={styles.metaLine} testID="home-streak">
            Seri: {streak} gün
          </Text>
        )}

        <View style={styles.actionCard}>
          <Text style={styles.actionKicker}>Soru çöz</Text>
          <Text style={styles.actionTitle}>Soru fotoğrafı gönder</Text>
          <Text style={styles.actionBody}>
            Kitap, defter veya deneme sayfasındaki soruyu kadraja al. Metin ve şıklar net
            görünsün.
          </Text>

          <Pressable
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel="Soru fotoğrafı çek"
            testID="capture-cta"
            onPress={() => void openPicker('camera')}>
            <Text style={styles.primaryBtnLabel}>Soru fotoğrafı çek</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            accessibilityRole="button"
            accessibilityLabel="Galeriden soru fotoğrafı seç"
            testID="gallery-cta"
            onPress={() => void openPicker('library')}>
            <Text style={styles.secondaryBtnLabel}>Galeriden soru seç</Text>
          </Pressable>

          <Text style={styles.micro}>
            AI destekli çözüm üretilir; sonucu mutlaka kontrol et.
          </Text>
        </View>

        <Pressable
          style={styles.topicsLink}
          accessibilityRole="button"
          testID="home-topics-link"
          onPress={() => router.push('/(tabs)/topics')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.topicsLinkTitle}>Örnek soru ve konu anlatımı</Text>
            <Text style={styles.topicsLinkBody}>
              Seçili sınavdan hazır örnekleri adım adım incele.
            </Text>
          </View>
          <Text style={styles.topicsChevron}>›</Text>
        </Pressable>

        <Text style={styles.section}>Son çözülenler</Text>
        {loading ? (
          <ActivityIndicator color={colors.navy} />
        ) : recent.length === 0 ? (
          <EmptyState
            testID="home-recent-empty"
            title="Henüz çözülmüş soru yok"
            subtitle="Yukarıdan soru fotoğrafı çekerek ilk çözümünü başlat."
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
    paddingBottom: space.xl,
  },
  brand: {
    fontFamily: typography.fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.4,
  },
  tagline: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: space.lg,
    lineHeight: 22,
  },
  metaLine: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: space.md,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.md,
    ...shadows.soft,
  },
  actionKicker: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.orange,
    marginBottom: 6,
  },
  actionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },
  actionBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: space.md,
  },
  primaryBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.cta,
  },
  primaryBtnLabel: {
    fontFamily: typography.fontFamily,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: space.sm,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
    backgroundColor: colors.white,
  },
  secondaryBtnLabel: {
    fontFamily: typography.fontFamily,
    color: colors.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  micro: {
    fontFamily: typography.fontFamily,
    marginTop: space.md,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    textAlign: 'center',
  },
  topicsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navySoft,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.lg,
    gap: space.sm,
  },
  topicsLinkTitle: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    fontSize: 15,
    color: colors.navy,
  },
  topicsLinkBody: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  topicsChevron: {
    fontSize: 28,
    color: colors.navy,
    fontWeight: '300',
    paddingLeft: space.sm,
  },
  section: {
    fontFamily: typography.fontFamily,
    fontWeight: '700',
    color: colors.navy,
    fontSize: 17,
    marginBottom: space.sm,
  },
  recentRow: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
