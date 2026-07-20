import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
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
import { ActiveExamBadge } from '@/src/features/exam/ActiveExamBadge';
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
import { CozbilRobot } from '@/src/ui/CozbilRobot';

export default function HomeScreen() {
  const router = useRouter();
  const [recent, setRecent] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState<ExamType | null>(null);
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
          const [attempts, userSnap, entitlement] = await Promise.all([
            fetchAttempts({ limit: 5 }).catch(() => ({ items: [] as AttemptListItem[] })),
            getDoc(doc(db, 'users', user.uid)),
            hydrateEntitlement().catch(() => null),
          ]);
          if (!alive) return;
          setIsPremium(isPremiumActive(entitlement ?? undefined));
          setRecent((attempts.items ?? []).filter((i) => i.status === 'solved'));
          const preferred = await readExamPreference();
          const et = userSnap.data()?.examType;
          // Preference (set at onboarding) wins; else Firestore examType.
          if (preferred) {
            setExamType(preferred);
            if (et !== preferred) {
              void callUpdateExamType(preferred).catch(() => undefined);
            }
          } else if (isExamType(et)) {
            setExamType(et);
            void callUpdateExamType(et).catch(() => undefined);
          } else {
            setExamType('lgs');
            void callUpdateExamType('lgs').catch(() => undefined);
          }
        } catch {
          if (!alive) return;
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
            <Text style={styles.brand}>{brand.name}</Text>
          </View>
          <Pressable
            testID="home-premium-cta"
            accessibilityRole="button"
            accessibilityLabel={isPremium ? 'Premium planı gör' : 'Premium’a geç'}
            style={[styles.premiumPill, isPremium && styles.premiumPillOn]}
            onPress={() => router.push('/premium')}>
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

        <ActiveExamBadge
          examType={examType}
          onPressChange={() => router.push('/settings')}
        />

        {subjectHintBanner ? (
          <View style={styles.hintChip} testID="home-subject-hint">
            <Text style={styles.hintChipText}>Ders ipucu: {subjectHintBanner}</Text>
          </View>
        ) : null}

        <View style={styles.hero}>
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
            style={styles.secondaryLink}
            accessibilityRole="button"
            accessibilityLabel="Galeriden soru fotoğrafı seç"
            testID="gallery-cta"
            onPress={() => void openPicker('library')}>
            <Text style={styles.secondaryLinkLabel}>Galeriden seç</Text>
          </Pressable>

          <Pressable
            style={styles.multiBtn}
            accessibilityRole="button"
            accessibilityLabel="Çoklu soru seç"
            testID="multi-batch-cta"
            onPress={() => void openMultiBatch()}>
            <SymbolView
              name={{
                ios: 'square.stack.3d.up.fill',
                android: 'layers',
                web: 'layers',
              }}
              tintColor={colors.navy}
              size={16}
            />
            <Text style={styles.multiBtnLabel}>
              Çoklu soru (en fazla {MULTI_BATCH_MAX})
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.topicsLink}
          accessibilityRole="button"
          testID="home-topics-link"
          onPress={() => router.push('/(tabs)/topics')}>
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
  brand: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.3,
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
    marginBottom: space.lg,
    alignItems: 'stretch',
  },
  primaryBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    ...shadows.cta,
  },
  primaryBtnLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryLink: {
    marginTop: space.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryLinkLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  multiBtn: {
    marginTop: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiBtnLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
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
