import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EXAM_LABEL, EXAM_OPTIONS } from '@/src/features/exam/examLabels';
import { EXAM_THEME, examThemeFor } from '@/src/features/exam/examTheme';
import { EXAM_TYPES } from '@/src/features/exam/examTypes';
import {
  fetchProgressAttempts,
  progressForExam,
} from '@/src/lib/api/progressClient';
import type { AttemptListItem, ExamType, ProgressSummary } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

/** Hafta başı Pazartesi → Pzt … Paz */
const WEEK_LABELS_MON = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

function streakBlurb(n: number): string {
  if (n <= 0) return 'Seriyi başlat — bugün bir soru yeter.';
  if (n === 1) return 'İlk günü yakaladın. Yarın da gel, seri büyüsün.';
  return 'Serin devam ediyor. Bir gün koparsa sıfırlanır — bugün bir soru yeter.';
}

function summaryHasData(s: ProgressSummary | null): boolean {
  if (!s) return false;
  return (
    (s.totalSolved ?? 0) > 0 ||
    s.topics.length > 0 ||
    s.weekly.some((w) => w.solvedCount > 0)
  );
}

function pickDefaultExam(items: AttemptListItem[]): ExamType {
  for (const exam of EXAM_TYPES) {
    if (summaryHasData(progressForExam(items, exam))) return exam;
  }
  return 'lgs';
}

export default function StatsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AttemptListItem[]>([]);
  const [examType, setExamType] = useState<ExamType>('lgs');
  const seededRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchProgressAttempts();
          if (!alive) return;
          setItems(data);
          if (!seededRef.current) {
            setExamType(pickDefaultExam(data));
            seededRef.current = true;
          }
        } catch {
          if (alive) {
            setItems([]);
            setError('İstatistik yüklenemedi. Bağlantını kontrol edip tekrar dene.');
          }
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const theme = examThemeFor(examType)!;
  const summary = useMemo(
    () => progressForExam(items, examType),
    [items, examType],
  );

  const examsWithData = useMemo(() => {
    const set = new Set<ExamType>();
    for (const exam of EXAM_TYPES) {
      if (summaryHasData(progressForExam(items, exam))) set.add(exam);
    }
    return set;
  }, [items]);

  const maxAttempts = Math.max(
    1,
    ...summary.topics.map((t) => t.attemptCount),
    1,
  );
  const maxWeekly = Math.max(1, ...summary.weekly.map((w) => w.solvedCount), 1);
  const topTopics = summary.topics.slice(0, 5);
  const hasData = summaryHasData(summary);
  const otherWithData = EXAM_TYPES.filter(
    (e) => e !== examType && examsWithData.has(e),
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.soft }]}
      contentContainerStyle={styles.content}
      testID="stats-screen">
      <Text style={[styles.eyebrow, { color: theme.solid }]}>İlerleme</Text>
      <Text style={styles.title}>İstatistik</Text>
      <Text style={styles.subtitle}>
        Sınav sekmeleri bağımsız. Hafta Pazartesi başlar.
      </Text>

      <Text style={styles.filterLabel}>Sınav</Text>
      <SegmentedTabs
        testID="stats-exam-tabs"
        itemTestIDPrefix="stats-exam"
        variant="track"
        value={examType}
        onChange={setExamType}
        activeColor={theme.solid}
        accentColor={theme.accent}
        items={EXAM_OPTIONS.map((o) => {
          const has = examsWithData.has(o.id);
          return {
            id: o.id,
            label: o.label,
            caption: has ? 'Veriler Hazır' : 'Veri yok',
            captionTone: has ? ('ready' as const) : ('empty' as const),
            muted: !has,
          };
        })}
      />

      <View
        style={[styles.modeChip, { backgroundColor: theme.solid }]}
        testID="stats-mode-chip">
        <Text style={styles.modeChipText}>{theme.modeChip}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.solid} style={{ marginTop: space.lg }} />
      ) : error ? (
        <EmptyState title="Yüklenemedi" subtitle={error} />
      ) : !hasData ? (
        <View style={styles.emptyBlock} testID="stats-empty">
          <EmptyState
            title={`${EXAM_LABEL[examType]} · Veri yok`}
            subtitle={
              otherWithData.length > 0
                ? `Bu sınavda henüz soru çözülmedi. ${otherWithData
                    .map((e) => EXAM_LABEL[e])
                    .join(', ')} sekmesinde verilerin hazır — oraya geç veya ${EXAM_LABEL[examType]} sorusu çöz.`
                : `${EXAM_LABEL[examType]} modunda henüz soru çözülmedi. Bir soru çözünce seri ve bar’lar burada oluşur.`
            }
          />
          {otherWithData.length > 0 ? (
            <View style={styles.otherRow}>
              {otherWithData.map((e) => (
                <Pressable
                  key={e}
                  style={[styles.otherChip, { backgroundColor: EXAM_THEME[e].solid }]}
                  testID={`stats-jump-${e}`}
                  onPress={() => setExamType(e)}>
                  <Text style={styles.otherChipText}>
                    {EXAM_THEME[e].modeChip} verisine git
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              style={[styles.primaryCta, { backgroundColor: theme.solid }]}
              testID="stats-empty-cta"
              onPress={() => router.push('/(tabs)')}>
              <Text style={styles.primaryCtaText}>Ana sayfada soru çöz</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          <View style={styles.streakHero} testID="stats-streak">
            <View style={[styles.streakRing, { borderColor: theme.accent }]}>
              <Text style={[styles.streakNum, { color: theme.solid }]}>
                {summary.streakCount}
              </Text>
              <Text style={[styles.streakUnit, { color: theme.accent }]}>gün seri</Text>
            </View>
            <Text style={styles.streakHint}>{streakBlurb(summary.streakCount)}</Text>
            {(summary.totalSolved ?? 0) > 0 ? (
              <Text style={styles.totalSolved}>
                {EXAM_LABEL[examType]} · toplam {summary.totalSolved} çözüm
              </Text>
            ) : null}
          </View>

          {summary.weekly.length > 0 ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.section}>Bu hafta</Text>
              <Text style={styles.sectionSub}>
                {EXAM_LABEL[examType]} · Pzt → Paz
              </Text>
              <View style={styles.weekly} testID="weekly-series">
                {summary.weekly.map((w, idx) => {
                  const h = Math.max(
                    8,
                    Math.round((w.solvedCount / maxWeekly) * 56),
                  );
                  const on = w.solvedCount > 0;
                  return (
                    <View key={w.date} style={styles.weekCol}>
                      <View style={styles.weekBarTrack}>
                        <View
                          style={{
                            height: on ? h : 8,
                            width: 14,
                            borderRadius: 7,
                            alignSelf: 'center',
                            backgroundColor: on ? theme.accent : colors.border,
                          }}
                        />
                      </View>
                      <Text
                        style={[
                          styles.weekDay,
                          on && { color: theme.solid, fontWeight: '700' },
                        ]}>
                        {WEEK_LABELS_MON[idx] ?? w.date.slice(5)}
                      </Text>
                      <Text style={styles.weekCount}>{w.solvedCount}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {summary.subjectMix && summary.subjectMix.length > 0 ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.section}>Ders dağılımı</Text>
              <Text style={styles.sectionSub}>Nereye ağırlık verdin?</Text>
              <View style={styles.mixRow} testID="subject-mix">
                {summary.subjectMix.map((s) => (
                  <View key={s.subject} style={styles.mixChip}>
                    <View style={styles.mixTrack}>
                      <View
                        style={[
                          styles.mixFill,
                          {
                            width: `${Math.max(8, s.pct)}%`,
                            backgroundColor: theme.solid,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.mixLabel}>
                      {s.label} · %{s.pct}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {topTopics.length > 0 ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.section}>Konu yoğunluğu</Text>
              <Text style={styles.sectionSub}>En çok çalıştığın konular</Text>
              {topTopics.map((t) => (
                <View
                  key={t.topicId}
                  style={styles.barRow}
                  testID={`topic-bar-${t.topicId}`}>
                  <View style={styles.barHead}>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {t.nameTr}
                    </Text>
                    <Text style={[styles.barCount, { color: theme.solid }]}>
                      {t.attemptCount}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.round((t.attemptCount / maxAttempts) * 100)}%`,
                          backgroundColor: theme.accent,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {summary.weakestTopic ? (
            <View
              style={[styles.focusCard, { borderColor: theme.accent }]}
              testID="weakest-topic">
              <Text style={[styles.focusEyebrow, { color: theme.accent }]}>
                Bugünkü odak · {EXAM_LABEL[examType]}
              </Text>
              <Text style={styles.focusName}>{summary.weakestTopic.nameTr}</Text>
              <Text style={styles.focusHint}>
                {summary.focusHint ?? 'En zayıf halkayı bugün kırmaya değer.'}
              </Text>
              <Pressable
                style={styles.focusCta}
                testID="stats-focus-cta"
                onPress={() =>
                  router.push({
                    pathname: '/topic/[id]',
                    params: { id: summary.weakestTopic!.topicId },
                  })
                }>
                <Text style={[styles.focusCtaText, { color: theme.solid }]}>
                  Konu anlatımına git →
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  eyebrow: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: space.md,
    lineHeight: 22,
  },
  filterLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.navy,
    marginBottom: space.sm,
    opacity: 0.72,
  },
  modeChip: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: space.md,
    marginBottom: space.md,
  },
  modeChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  emptyBlock: { marginTop: space.sm },
  otherRow: { gap: space.sm, marginTop: space.md },
  otherChip: {
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    alignItems: 'center',
  },
  otherChipText: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  streakHero: { alignItems: 'center', marginBottom: space.lg },
  streakRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 6,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  streakNum: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
  },
  streakUnit: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  streakHint: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.md,
    lineHeight: 19,
    paddingHorizontal: space.md,
  },
  totalSolved: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: space.sm,
  },
  sectionBlock: { marginBottom: space.lg },
  section: {
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    fontSize: 22,
    color: colors.navy,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  sectionSub: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: space.md,
    lineHeight: 20,
  },
  weekly: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  weekCol: { alignItems: 'center', flex: 1 },
  weekBarTrack: { height: 56, justifyContent: 'flex-end', marginBottom: 6 },
  weekDay: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  weekCount: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 2,
  },
  mixRow: { gap: space.sm },
  mixChip: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mixTrack: {
    height: 8,
    backgroundColor: colors.navySoft,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  mixFill: { height: '100%', borderRadius: 4 },
  mixLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  barRow: { marginBottom: space.md },
  barHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    flex: 1,
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: space.sm,
  },
  barTrack: {
    height: 10,
    backgroundColor: colors.navySoft,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 6 },
  barCount: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  focusCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.lg,
    borderWidth: 1.5,
    ...shadows.soft,
  },
  focusEyebrow: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  focusName: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },
  focusHint: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 19,
  },
  focusCta: { marginTop: space.md, alignSelf: 'flex-start' },
  focusCtaText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryCta: {
    marginTop: space.md,
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryCtaText: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
