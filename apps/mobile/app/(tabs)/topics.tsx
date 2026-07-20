import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EXAM_LABEL, EXAM_OPTIONS, EXAM_SHORT } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import { subjectThemeFor } from '@/src/features/exam/subjectTheme';
import { itemsForExamSubject } from '@/src/data/itemBank';
import { lessonForTopic } from '@/src/data/topicLessons';
import {
  findTopic,
  subjectLabel,
  subjectsForExam,
  topicsForExamSubject,
} from '@/src/data';
import type { ExamType, Subject } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { CatalogBreadcrumb } from '@/src/ui/CatalogBreadcrumb';
import { EmptyState } from '@/src/ui/EmptyState';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';
import { TR_EYEBROW } from '@/src/lib/trCase';

type PanelId = 'topics' | 'samples';

export default function TopicsScreen() {
  const router = useRouter();
  const [examType, setExamType] = useState<ExamType>('lgs');
  const subjects = useMemo(() => subjectsForExam(examType), [examType]);
  const [subject, setSubject] = useState<Subject>(subjects[0] ?? 'math');
  const [panel, setPanel] = useState<PanelId>('topics');

  const theme = examThemeFor(examType)!;
  const subjectTheme = subjectThemeFor(subject);

  const topics = useMemo(
    () => topicsForExamSubject(examType, subject),
    [examType, subject],
  );
  const samples = useMemo(
    () => itemsForExamSubject(examType, subject),
    [examType, subject],
  );

  function switchExam(next: ExamType) {
    setExamType(next);
    const nextSubjects = subjectsForExam(next);
    setSubject(nextSubjects[0] ?? 'math');
    setPanel('topics');
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.soft }]}
      contentContainerStyle={styles.content}
      testID="topics-screen">
      <Eyebrow color={theme.solid} style={styles.eyebrow}>
        {TR_EYEBROW.curriculum}
      </Eyebrow>
      <Text style={styles.title}>Konu anlatımı</Text>
      <Text style={styles.subtitle}>
        Sınav seç → ders → konu veya örnek soru. Ana sayfa modundan bağımsız gez.
      </Text>

      <View
        style={[styles.modeChip, { backgroundColor: theme.solid }]}
        testID="topics-mode-chip">
        <Text style={styles.modeChipText}>{theme.modeChip}</Text>
      </View>

      <Text style={styles.filterLabel}>Sınav</Text>
      <SegmentedTabs
        testID="topics-exam-tabs"
        itemTestIDPrefix="topics-exam"
        variant="track"
        value={examType}
        onChange={switchExam}
        activeColor={theme.solid}
        accentColor={theme.accent}
        items={EXAM_OPTIONS.map((o) => ({
          id: o.id,
          label: o.label,
          caption: EXAM_SHORT[o.id],
        }))}
      />

      <Text style={[styles.filterLabel, styles.spaced]}>Ders</Text>
      <SegmentedTabs
        testID="topics-subject-filters"
        itemTestIDPrefix="topics-subject"
        variant="chips"
        value={subject}
        onChange={(id) => {
          setSubject(id);
          setPanel('topics');
        }}
        activeColor={theme.solid}
        accentColor={theme.accent}
        items={subjects.map((s) => ({ id: s, label: subjectLabel(s) }))}
      />

      <Text style={[styles.filterLabel, styles.spaced]}>İçerik</Text>
      <SegmentedTabs
        testID="topics-panel-tabs"
        itemTestIDPrefix="topics-panel"
        variant="track"
        value={panel}
        onChange={setPanel}
        activeColor={theme.solid}
        accentColor={theme.accent}
        items={[
          {
            id: 'topics' as const,
            label: 'Konular',
            caption: `${topics.length} anlatım`,
          },
          {
            id: 'samples' as const,
            label: 'Örnek sorular',
            caption: `${samples.length} soru`,
          },
        ]}
      />

      <CatalogBreadcrumb
        testID="topics-branch-crumb"
        examType={examType}
        examLabel={EXAM_LABEL[examType]}
        subject={subject}
        subjectLabel={subjectLabel(subject)}
      />
      <Text style={[styles.branchTitle, { color: theme.solid }]}>
        {panel === 'topics' ? 'Konu anlatımları' : 'Örnek sorular'}
      </Text>

      {panel === 'topics' ? (
        topics.length === 0 ? (
          <EmptyState title="Bu derste konu yok" subtitle="Başka bir ders seç." />
        ) : (
          <View style={styles.topicList} testID="topics-list">
            {topics.map((t) => {
              const lesson = lessonForTopic(t.id, {
                nameTr: t.nameTr,
                subject: t.subject,
                examType: t.examType,
              });
              const sampleCount = samples.filter((s) => s.topicId === t.id).length;
              return (
                <Pressable
                  key={t.id}
                  style={[
                    styles.topicRow,
                    {
                      borderColor: subjectTheme.solid,
                      backgroundColor: colors.white,
                    },
                  ]}
                  testID={`catalog-topic-${t.id}`}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({ pathname: '/topic/[id]', params: { id: t.id } })
                  }>
                  <View
                    style={[styles.topicAccent, { backgroundColor: subjectTheme.solid }]}
                  />
                  <View style={styles.topicRowMain}>
                    <CatalogBreadcrumb
                      examType={examType}
                      examLabel={EXAM_LABEL[examType]}
                      subject={t.subject}
                      subjectLabel={subjectLabel(t.subject)}
                      topicLabel={t.nameTr}
                    />
                    <Text style={[styles.topicRowTitle, { color: theme.solid }]}>
                      {t.nameTr}
                    </Text>
                    <Text style={styles.topicRowMeta}>
                      {lesson ? 'Anlatım hazır' : 'Özet'}
                      {sampleCount > 0 ? ` · ${sampleCount} örnek` : ' · örnek yok'}
                    </Text>
                  </View>
                  <Text style={[styles.topicChevron, { color: theme.solid }]}>›</Text>
                </Pressable>
              );
            })}
          </View>
        )
      ) : samples.length === 0 ? (
        <View style={styles.emptySamples} testID="topics-samples-empty">
          <Text style={styles.hint}>
            Bu ders için örnek soru henüz yok. Konular sekmesinden anlatımı oku.
          </Text>
        </View>
      ) : (
        <View testID="topics-samples-list">
          {samples.map((item) => {
            const topic = findTopic(item.topicId);
            const itemSubjectTheme = subjectThemeFor(item.subject);
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.card,
                  {
                    borderColor: itemSubjectTheme.solid,
                    borderLeftWidth: 4,
                  },
                ]}
                testID={`topic-item-${item.id}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/sample/[id]', params: { id: item.id } })
                }>
                <CatalogBreadcrumb
                  examType={examType}
                  examLabel={EXAM_LABEL[examType]}
                  subject={item.subject}
                  subjectLabel={subjectLabel(item.subject)}
                  topicLabel={topic?.nameTr}
                  difficulty={item.difficulty}
                />
                <Text style={[styles.cardTitle, { color: theme.solid }]} numberOfLines={3}>
                  {item.stem}
                </Text>
                <Text style={[styles.cardCta, { color: itemSubjectTheme.solid }]}>
                  Konuyu + çözümü gör →
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl * 2,
  },
  eyebrow: {
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: space.md,
    lineHeight: 20,
  },
  modeChip: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: space.md,
  },
  modeChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  filterLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  spaced: { marginTop: space.lg },
  branchTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    fontWeight: '700',
    marginTop: space.lg,
    marginBottom: space.md,
  },
  topicList: { gap: space.sm },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    paddingRight: space.md,
    paddingVertical: 12,
    overflow: 'hidden',
    ...shadows.soft,
  },
  topicAccent: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: space.md,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  topicRowMain: { flex: 1, paddingLeft: 0 },
  topicRowTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  topicRowMeta: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  topicChevron: {
    fontFamily: typography.fontFamily,
    fontSize: 22,
    marginLeft: space.sm,
  },
  hint: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  emptySamples: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1.5,
    ...shadows.soft,
  },
  cardTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
    lineHeight: 22,
  },
  cardCta: {
    fontFamily: typography.fontFamilySemiBold,
    marginTop: space.md,
    fontSize: 13,
    fontWeight: '700',
  },
});
