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

import {
  BannerSlot,
  isPremiumAudience,
  runRewardedMultiBatchUnlock,
} from '@/src/features/ads';
import { ExamModeSwitcher } from '@/src/features/exam/ExamModeSwitcher';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { readExamPreference } from '@/src/features/exam/examPreference';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { isExamType } from '@/src/features/exam/examTypes';
import { callUpdateExamType } from '@/src/features/exam/updateExamClient';
import {
  pickFromCamera,
  pickFromLibrary,
  pickMultipleFromLibrary,
} from '@/src/features/solve/image';
import { MULTI_BATCH_MAX, multiBatchUserCopy } from '@/src/features/solve/multiBatchPolicy';
import { setPendingMultiBatch } from '@/src/features/solve/multiBatchStore';
import {
  peekPendingSubjectHint,
  takePendingSubjectHint,
} from '@/src/features/solve/subjectHintStore';
import { fetchAttempts, fetchProgressSummary } from '@/src/lib/api/progressClient';
import type { AttemptListItem, ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import {
  hydrateEntitlement,
  isPremiumActive,
} from '@/src/features/paywall/entitlement';
import { brand, colors, radii, shadows, space, typography } from '@/src/theme';
import { findTopic, subjectLabel, topicsForExam } from '@/src/data';
import { EmptyState } from '@/src/ui/EmptyState';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { TR_EYEBROW, trUpper } from '@/src/lib/trCase';

export default function HomeScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [switching, setSwitching] = useState(false);
  const [subjectHintBanner, setSubjectHintBanner] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const pending = peekPendingSubjectHint();
      setSubjectHintBanner(pending ? subjectLabel(pending) : null);
      void (async () => {
        setLoading(true);
        try {
          const user = await ensureSignedIn();
          const { db } = getFirebase();
          const [progress, attempts, userSnap, entitlement] = await Promise.all([
            fetchProgressSummary().catch(() => ({ streakCount: 0 })),
            fetchAttempts({ limit: 5 }).catch(() => ({ items: [] as AttemptListItem[] })),
            getDoc(doc(db, 'users', user.uid)),
            hydrateEntitlement().catch(() => null),
          ]);
          if (!alive) return;
          setIsPremium(isPremiumActive(entitlement ?? undefined));
          setStreak(progress.streakCount ?? 0);
          setRecent((attempts.items ?? []).filter((i) => i.status === 'solved'));
          const preferred = await readExamPreference();
          const et = userSnap.data()?.examType;
          if (preferred) {
            setExamType(preferred);
            if (et !== preferred) {
              void callUpdateExamType(preferred).catch(() => undefined);
            }
          } else if (isExamType(et)) {
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
      Alert.alert('Önce sınav seç', 'LGS, YGS, KPSS veya Ehliyet seçmeden soru gönderilemez.');
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
    const subjectHint = takePendingSubjectHint() ?? undefined;
    setSubjectHintBanner(null);
    router.push({
      pathname: '/capture-confirm',
      params: {
        uri: picked.uri,
        mimeType: picked.mimeType ?? 'image/jpeg',
        source,
        examType: examType!,
        ...(subjectHint ? { subjectHint } : {}),
      },
    });
  }

  async function openMultiBatch() {
    if (!examType) {
      Alert.alert('Önce sınav seç', 'LGS, YGS, KPSS veya Ehliyet seçmeden soru gönderilemez.');
      return;
    }
    const copy = multiBatchUserCopy();
    const premium = isPremiumAudience();
    Alert.alert(copy.title, premium ? copy.premiumBody : copy.freeBody, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: premium ? 'Galeriden seç' : 'Reklam izle ve seç',
        onPress: () => {
          void (async () => {
            const unlock = await runRewardedMultiBatchUnlock();
            if (!unlock.allowed) {
              if (unlock.reason === 'daily_cap') {
                Alert.alert(
                  'Günlük limit',
                  'Bugünkü çoklu soru açılış hakkın doldu. Yarın tekrar dene veya Premium’a geç.',
                );
                return;
              }
              Alert.alert('Devam edilmedi', 'Reklam tamamlanmadan çoklu soru açılamaz.');
              return;
            }
            const picked = await pickMultipleFromLibrary(MULTI_BATCH_MAX);
            if (!picked?.length) {
              Alert.alert('Seçim yok', SAFETY_MESSAGES.permissionLibrary);
              return;
            }
            setSubjectHintBanner(null);
            if (picked.length === 1) {
              const subjectHint = takePendingSubjectHint() ?? undefined;
              router.push({
                pathname: '/capture-confirm',
                params: {
                  uri: picked[0]!.uri,
                  mimeType: picked[0]!.mimeType ?? 'image/jpeg',
                  source: 'library',
                  examType: examType!,
                  ...(subjectHint ? { subjectHint } : {}),
                },
              });
              return;
            }
            // Multi: clear ders ipucu — her fotoğraf kendi sınav/branşını algılar.
            takePendingSubjectHint();
            setPendingMultiBatch({
              images: picked,
              examType: examType ?? undefined,
            });
            router.push('/capture-confirm-batch');
          })();
        },
      },
    ]);
  }

  const subjectCount =
    examType != null ? new Set(topicsForExam(examType).map((t) => t.subject)).size : 0;
  const topicCount = examType != null ? topicsForExam(examType).length : 0;
  const examTheme = examThemeFor(examType);

  return (
    <View
      style={[styles.root, examTheme ? { backgroundColor: examTheme.soft } : null]}
      testID="home-screen">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.topBrandCol}>
            <Text style={styles.brand}>{brand.name}</Text>
            <Text style={styles.tagline}>
              Kitaptaki veya defterdeki sorunun fotoğrafını çek, adım adım anlatılsın.
            </Text>
          </View>
          <Pressable
            testID="home-premium-cta"
            accessibilityRole="button"
            accessibilityLabel={isPremium ? 'Premium planı gör' : 'Premium’a geç'}
            style={[styles.premiumPill, isPremium && styles.premiumPillOn]}
            onPress={() => router.push('/premium')}>
            <Text
              style={[
                styles.premiumPillLabel,
                isPremium && styles.premiumPillLabelOn,
              ]}>
              {isPremium ? TR_EYEBROW.premium : 'Premium'}
            </Text>
          </Pressable>
        </View>

        <ExamModeSwitcher
          value={examType}
          onChange={(e) => void onExamChange(e)}
          disabled={switching}
        />

        {examType && examTheme ? (
          <View
            style={[styles.metaChip, { backgroundColor: examTheme.solid }]}
            testID="home-streak">
            <Text style={styles.metaChipText}>
              {examTheme.modeChip} · Seri {streak} gün · {subjectCount} ders · {topicCount} konu
            </Text>
          </View>
        ) : (
          <Text style={styles.metaLine} testID="home-streak">
            Seri: {streak} gün
          </Text>
        )}

        {subjectHintBanner ? (
          <Text style={styles.hintBanner} testID="home-subject-hint">
            Ders ipucu: {subjectHintBanner} — sonraki fotoğrafa eklenecek
          </Text>
        ) : null}

        <View
          style={[
            styles.actionCard,
            examTheme
              ? { borderColor: examTheme.accent, borderWidth: 1.5 }
              : null,
          ]}>
          <Eyebrow
            style={[
              styles.actionKicker,
              examTheme ? { color: examTheme.solid } : null,
            ]}>
            {trUpper(`Soru çöz · ${examTheme ? examTheme.label : 'sınav seç'}`)}
          </Eyebrow>
          <Text style={styles.actionTitle}>Soru fotoğrafı gönder</Text>
          <Text style={styles.actionBody}>
            Kitap, defter veya denemedeki soruyu net çek. Soru metni ve şıklar okunaklı
            olsun.
            {examTheme
              ? ` Çözüm ${examTheme.label} (${examTheme.short}) paketine göre işlenir.`
              : ''}
          </Text>

          <Pressable
            style={[
              styles.primaryBtn,
              examTheme ? { backgroundColor: examTheme.accent } : null,
            ]}
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

          <Pressable
            style={styles.multiBtn}
            accessibilityRole="button"
            accessibilityLabel="Çoklu soru seç"
            testID="multi-batch-cta"
            onPress={() => void openMultiBatch()}>
            <Text style={styles.multiBtnLabel}>
              Çoklu soru · en fazla {MULTI_BATCH_MAX}
            </Text>
            <Text style={styles.multiBtnCaption}>
              Önce önizleme, sonra çözüm · her soru ayrı sekmede
            </Text>
          </Pressable>

          <Text style={styles.micro}>
            Yapay zekâ destekli anlatım üretilir; cevabı mutlaka kontrol et.
          </Text>
        </View>

        <Pressable
          style={styles.topicsLink}
          accessibilityRole="button"
          testID="home-topics-link"
          onPress={() => router.push('/(tabs)/topics')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.topicsLinkTitle}>Konu anlatımı</Text>
            <Text style={styles.topicsLinkBody}>
              LGS · YGS · KPSS · Ehliyet → ders → konu ve örnek sorular.
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
              <Pressable
                style={styles.recentRow}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/history/[attemptId]',
                    params: { attemptId: item.attemptId },
                  })
                }>
                <Text style={styles.recentTopic}>
                  {item.topicId
                    ? (findTopic(item.topicId)?.nameTr ?? item.topicId)
                    : 'Konu yok'}
                </Text>
                <Text style={styles.recentMeta}>
                  {subjectLabel(item.subject)}
                  {item.examType ? ` · ${EXAM_LABEL[item.examType]}` : ''}
                </Text>
              </Pressable>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    marginBottom: space.lg,
  },
  topBrandCol: { flex: 1 },
  brand: {
    fontFamily: typography.fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.4,
  },
  tagline: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 23,
  },
  premiumPill: {
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    ...shadows.cta,
  },
  premiumPillOn: {
    backgroundColor: colors.navy,
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  premiumPillLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.3,
  },
  premiumPillLabelOn: {
    color: colors.orange,
  },
  metaLine: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: space.md,
  },
  metaChip: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: space.md,
  },
  metaChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  hintBanner: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.orange,
    marginBottom: space.md,
    lineHeight: 18,
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
    letterSpacing: 0.6,
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
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
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
  multiBtn: {
    marginTop: space.sm,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    alignItems: 'center',
    backgroundColor: colors.navySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiBtnLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  multiBtnCaption: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
  micro: {
    fontFamily: typography.fontFamily,
    marginTop: space.md,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
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
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 20,
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
