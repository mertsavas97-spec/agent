import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
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
import { loadExamPreferenceCached } from '@/src/features/exam/examPreferenceCache';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { isExamType } from '@/src/features/exam/examTypes';
import {
  loadEntitlementSnapshot,
  useExamModeChange,
} from '@/src/features/exam/useExamModeChange';
import {
  pickFromCamera,
  pickFromLibrary,
  pickMultipleFromLibrary,
} from '@/src/features/solve/image';
import { MULTI_BATCH_MAX, multiBatchUserCopy } from '@/src/features/solve/multiBatchPolicy';
import { setPendingMultiBatch } from '@/src/features/solve/multiBatchStore';
import { setPendingSolveImage } from '@/src/features/solve/pendingSolveImageStore';
import {
  peekPendingSubjectHint,
  takePendingSubjectHint,
} from '@/src/features/solve/subjectHintStore';
import {
  buildHomeStreakView,
  loadLocalStreakState,
} from '@/src/features/stats/localStreakStore';
import { fetchAttempts } from '@/src/lib/api/progressClient';
import type { AttemptListItem, ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import {
  hydrateEntitlement,
  isPremiumActive,
} from '@/src/features/paywall/entitlement';
import { brand, colors, radii, shadows, space, typography } from '@/src/theme';
import { findTopic, subjectLabel } from '@/src/data';
import { TR_EYEBROW } from '@/src/lib/trCase';
import { Button } from '@/src/ui/Button';
import { CozbilRobot } from '@/src/ui/CozbilRobot';
import { hapticSelection } from '@/src/ui/haptics';
import { PressableSurface } from '@/src/ui/PressableSurface';

export default function HomeScreen() {
  const router = useRouter();
  const [recent, setRecent] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [subjectHintBanner, setSubjectHintBanner] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [streakWeekFilled, setStreakWeekFilled] = useState<boolean[]>(
    () => Array(7).fill(false),
  );
  const [streakWeekLabels] = useState(() => ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']);
  const [ent, setEnt] = useState<Awaited<ReturnType<typeof loadEntitlementSnapshot>>>(null);
  const bootedRef = useRef(false);
  const { requestExamChange } = useExamModeChange({
    ent,
    onOptimistic: (next) => setExamType(next),
  });

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const pending = peekPendingSubjectHint();
      setSubjectHintBanner(pending ? subjectLabel(pending) : null);

      void (async () => {
        const cachedExam = await loadExamPreferenceCached();
        if (alive && cachedExam) {
          setExamType(cachedExam);
        }

        const showRecentSpinner = !bootedRef.current;
        if (showRecentSpinner) setLoading(true);

        try {
          const user = await ensureSignedIn();
          const { db } = getFirebase();
          const [attempts, userSnap, entitlement] = await Promise.all([
            fetchAttempts({ limit: 5 }).catch(() => ({ items: [] as AttemptListItem[] })),
            getDoc(doc(db, 'users', user.uid)),
            loadEntitlementSnapshot(),
          ]);
          if (!alive) return;
          setEnt(entitlement);
          setIsPremium(isPremiumActive(entitlement ?? undefined));
          setRecent((attempts.items ?? []).filter((i) => i.status === 'solved'));
          const data = userSnap.data();
          const localStreak = await loadLocalStreakState();
          const view = buildHomeStreakView({
            remoteStreakCount:
              typeof data?.streakCount === 'number' ? data.streakCount : 0,
            remoteLastActiveDate:
              typeof data?.streakLastActiveDate === 'string'
                ? data.streakLastActiveDate
                : null,
            local: localStreak,
          });
          setStreakCount(view.streakCount);
          setStreakWeekFilled(view.weekFilled);
          const et = data?.examType;
          if (!cachedExam) {
            if (isExamType(et)) {
              setExamType(et);
            } else if (!examType) {
              setExamType('lgs');
            }
          }
        } catch {
          if (!alive) return;
          setRecent([]);
          setExamType((prev) => prev ?? 'lgs');
        } finally {
          if (alive) {
            setLoading(false);
            bootedRef.current = true;
          }
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

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
    setPendingSolveImage(picked);
    router.push({
      pathname: '/capture-confirm',
      params: {
        // Fallback only — prefer pendingSolveImageStore (camera content:// safe).
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

  const examTheme = examThemeFor(examType);

  return (
    <View
      style={[styles.root, examTheme ? { backgroundColor: examTheme.soft } : null]}
      testID="home-screen">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <CozbilRobot
              size={40}
              animate
              tone="onLight"
              testID="home-brand-robot"
            />
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>{brand.name}</Text>
              <Text style={styles.greeting} testID="home-greeting">
                Merhaba
              </Text>
            </View>
            {streakCount >= 1 ? (
              <PressableSurface
                style={styles.streakChip}
                testID="home-streak"
                accessibilityRole="button"
                accessibilityLabel={`${streakCount} gün seri, istatistiklere git`}
                haptic="selection"
                onPress={() => router.push('/(tabs)/stats')}>
                <Text style={styles.streakChipText}>{streakCount} gün</Text>
              </PressableSurface>
            ) : null}
          </View>
          <Pressable
            testID="home-premium-cta"
            accessibilityRole="button"
            accessibilityLabel={isPremium ? 'Premium planı gör' : 'Premium’a geç'}
            style={[styles.premiumPill, isPremium && styles.premiumPillOn]}
            onPress={() => {
              void hapticSelection();
              router.push('/premium');
            }}>
            <SymbolView
              name={{
                ios: 'crown.fill',
                android: 'workspace_premium',
                web: 'workspace_premium',
              }}
              tintColor={colors.orange}
              size={14}
              style={styles.premiumIcon}
            />
            <Text
              style={[
                styles.premiumPillLabel,
                isPremium && styles.premiumPillLabelOn,
              ]}>
              {isPremium ? TR_EYEBROW.premium : 'Premium'}
            </Text>
          </Pressable>
        </View>

        <PressableSurface
          style={styles.streakWeek}
          testID="home-streak-week"
          accessibilityRole="button"
          accessibilityLabel="Günlük seri, istatistiklere git"
          haptic="selection"
          onPress={() => router.push('/(tabs)/stats')}>
          <View style={styles.streakWeekHeader}>
            <Text style={styles.streakWeekTitle}>
              {streakCount > 0 ? `${streakCount} gün seri` : 'Günlük seri'}
            </Text>
            <Text style={styles.streakWeekHint} testID="home-streak-hint">
              {streakCount > 0
                ? 'Bugün de bir soru çöz, kopmasın'
                : 'Bugün bir soru çöz — seri başlar'}
            </Text>
          </View>
          <View style={styles.streakDaysRow}>
            {streakWeekLabels.map((label, i) => {
              const filled = Boolean(streakWeekFilled[i]);
              return (
                <View key={label} style={styles.streakDayCol} testID={`home-streak-day-${i + 1}`}>
                  <View style={[styles.streakDay, filled && styles.streakDayOn]} />
                  <Text style={[styles.streakDayLabel, filled && styles.streakDayLabelOn]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </PressableSurface>

        <ExamModeSwitcher
          value={examType}
          onChange={(next) => requestExamChange(examType, next)}
        />

        {subjectHintBanner ? (
          <View style={styles.hintChip} testID="home-subject-hint">
            <Text style={styles.hintChipText}>Ders ipucu: {subjectHintBanner}</Text>
          </View>
        ) : null}

        <View style={styles.hero} testID="home-hero">
          <PressableSurface
            style={[
              styles.primaryBtn,
              examTheme ? { backgroundColor: examTheme.accent } : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Soru fotoğrafı çek"
            testID="capture-cta"
            haptic="medium"
            onPress={() => void openPicker('camera')}>
            <View style={styles.primaryBtnInner}>
              <SymbolView
                name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                tintColor={colors.navy}
                size={22}
              />
              <Text style={styles.primaryBtnLabel}>Soru fotoğrafı çek</Text>
            </View>
          </PressableSurface>

          <Button
            label="Galeriden seç"
            variant="secondary"
            haptic="light"
            accessibilityLabel="Galeriden soru fotoğrafı seç"
            testID="gallery-cta"
            style={styles.galleryBtn}
            left={
              <SymbolView
                name={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' }}
                tintColor={colors.navy}
                size={18}
              />
            }
            onPress={() => void openPicker('library')}
          />
        </View>

        <View style={styles.moreSection} testID="home-more">
          <Button
            label={`Çoklu çöz · en fazla ${MULTI_BATCH_MAX}`}
            variant="secondary"
            haptic="medium"
            accessibilityLabel="Çoklu soru seç"
            testID="multi-batch-cta"
            style={styles.multiBtn}
            left={
              <SymbolView
                name={{
                  ios: 'square.stack.3d.up.fill',
                  android: 'layers',
                  web: 'layers',
                }}
                tintColor={colors.navy}
                size={18}
              />
            }
            onPress={() => void openMultiBatch()}
          />

          <Pressable
            style={styles.topicsLink}
            accessibilityRole="button"
            testID="home-topics-link"
            onPress={() => {
              void hapticSelection();
              router.push('/(tabs)/topics');
            }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.topicsLinkTitle}>Konu anlatımı</Text>
              <Text style={styles.topicsLinkBody}>Derse göre konu ve örnek soru</Text>
            </View>
            <Text style={styles.topicsChevron}>›</Text>
          </Pressable>

          <Text style={styles.section}>Son çözülenler</Text>
        {loading ? (
          <ActivityIndicator color={colors.navy} />
        ) : recent.length === 0 ? (
          <Text style={styles.recentEmpty} testID="home-recent-empty">
            Henüz çözüm yok · İlk sorunu çek
          </Text>
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
        </View>
      </ScrollView>
      <BannerSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  container: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brandBlock: {
    flexShrink: 1,
  },
  brand: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.3,
  },
  greeting: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  streakWeek: {
    marginBottom: space.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakWeekHeader: {
    marginBottom: 10,
  },
  streakWeekTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  streakWeekHint: {
    marginTop: 2,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
  },
  streakDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakDayCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  streakDay: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.navySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakDayOn: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  streakDayLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
  },
  streakDayLabelOn: {
    color: colors.navy,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '600',
  },
  streakChip: {
    backgroundColor: colors.orangeSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.orange,
  },
  streakChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  premiumPillOn: {
    backgroundColor: colors.navy,
  },
  premiumIcon: {
    width: 14,
    height: 14,
  },
  premiumPillLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
    letterSpacing: 0.3,
  },
  premiumPillLabelOn: {
    color: colors.orange,
  },
  hintChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.orangeSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: space.md,
  },
  hintChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.orange,
  },
  hero: {
    marginTop: space.md,
    marginBottom: space.md,
    alignItems: 'stretch',
  },
  moreSection: {
    marginTop: space.sm,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  primaryBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    ...shadows.cta,
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtnLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700',
  },
  galleryBtn: {
    marginTop: space.md,
    alignSelf: 'stretch',
  },
  multiBtn: {
    marginBottom: space.sm,
    alignSelf: 'stretch',
  },
  topicsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navySoft,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    marginBottom: space.lg,
    gap: space.sm,
  },
  topicsLinkTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    fontSize: 15,
    color: colors.navy,
  },
  topicsLinkBody: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  topicsChevron: {
    fontSize: 26,
    color: colors.navy,
    fontWeight: '300',
    paddingLeft: space.sm,
  },
  section: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.navy,
    fontSize: 17,
    marginBottom: space.sm,
  },
  recentEmpty: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: space.md,
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
    fontFamily: typography.fontFamilySemiBold,
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
