import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { subjectLabel } from '@/src/data';
import {
  fullLessonCtaLabel,
  solutionLessonBullets,
  type TopicLesson,
} from '@/src/data/topicLessons';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { examThemeFor } from '@/src/features/exam/examTheme';
import type {
  ExamType,
  SolutionAnswer,
  SolutionStep,
  Subject,
} from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { AnalyticsEvents, track } from '@/src/lib/analytics';
import { TR_EYEBROW, trUpper } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { CatalogBreadcrumb } from '@/src/ui/CatalogBreadcrumb';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';
import { onSolveSuccessMaybeReview } from '@/src/features/review/inAppReview';

import {
  buildShortSummary,
  formatAnswerDisplay,
  reasoningSteps,
  resolveSolutionAnswer,
} from './solutionAnswer';

export type SolutionScreenProps = {
  steps: SolutionStep[];
  answer?: SolutionAnswer | null;
  transparencyNote?: string;
  imageUri?: string | null;
  solutionId?: string | null;
  examType?: ExamType | null;
  subject?: Subject | null;
  topicId?: string | null;
  topicName?: string | null;
  topicLesson?: TopicLesson | null;
  /** Tip-only assist — show honesty banner, no “çözüldü” implication */
  assisted?: boolean;
  onExplainAgain?: () => Promise<string>;
  onDone?: () => void;
};

const EXAM_TITLE: Record<ExamType, string> = {
  lgs: 'LGS',
  ygs: 'YGS',
  kpss: 'KPSS',
  trafik: 'Ehliyet',
};

type TabId = 'steps' | 'short' | 'lesson';

export function SolutionScreen({
  steps,
  answer: answerProp,
  transparencyNote = SAFETY_MESSAGES.transparency,
  imageUri,
  solutionId,
  examType,
  subject,
  topicId,
  topicName,
  topicLesson,
  assisted = false,
  onExplainAgain,
  onDone,
}: SolutionScreenProps) {
  const router = useRouter();
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('steps');

  // Multi-batch tab switch / new solution → reset inner tabs & follow-up
  useEffect(() => {
    setTab('steps');
    setFollowUp(null);
    setError(null);
  }, [solutionId, topicId, imageUri]);

  useEffect(() => {
    if (assisted) return;
    track(AnalyticsEvents.solveCompleted, {
      examType: examType ?? null,
      subject: subject ?? null,
      topicId: topicId ?? null,
    });
    void onSolveSuccessMaybeReview();
  }, [assisted, examType, subject, topicId, solutionId]);

  const answer = useMemo(
    () => resolveSolutionAnswer(answerProp, steps),
    [answerProp, steps],
  );
  const stepsOnly = useMemo(() => reasoningSteps(steps), [steps]);
  const shortBody = useMemo(
    () => followUp ?? buildShortSummary(answer, steps),
    [followUp, answer, steps],
  );

  async function handleExplain() {
    if (!onExplainAgain) return;
    setLoading(true);
    setError(null);
    try {
      const text = await onExplainAgain();
      setFollowUp(text);
    } catch {
      setError('Açıklama şu an üretilemedi.');
    } finally {
      setLoading(false);
    }
  }

  const tabs: { id: TabId; label: string; testID: string }[] = [
    { id: 'steps', label: 'Adım adım', testID: 'tab-steps' },
    { id: 'short', label: 'Kısa çözüm', testID: 'tab-short' },
    { id: 'lesson', label: 'Konu anlatımı', testID: 'tab-lesson' },
  ];

  const examTheme = examThemeFor(examType);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="solution-screen">
      <Text style={styles.heading}>Çözüm</Text>

      {assisted ? (
        <View style={styles.assistedBanner} testID="assisted-banner">
          <Text style={styles.assistedTitle}>Tam otomatik cevap yok</Text>
          <Text style={styles.assistedBody}>
            Branşa uygun hatırlatma gösteriyoruz. Net fotoğrafla tekrar dene veya
            dersi onayla.
          </Text>
        </View>
      ) : null}

      {examType && subject && subject !== 'unknown' ? (
        <View
          style={[
            styles.metaBand,
            examTheme ? { backgroundColor: examTheme.soft } : null,
          ]}
          testID="solution-meta">
          <CatalogBreadcrumb
            examType={examType}
            examLabel={EXAM_TITLE[examType]}
            subject={subject}
            subjectLabel={subjectLabel(subject)}
            topicLabel={topicName}
            testID="solution-breadcrumb"
          />
        </View>
      ) : (examType || subject || topicName) ? (
        <View
          style={[
            styles.metaBand,
            examTheme ? { backgroundColor: examTheme.soft } : null,
          ]}
          testID="solution-meta">
          {examType ? (
            <Text
              style={[
                styles.metaExam,
                examTheme ? { color: examTheme.solid } : null,
              ]}>
              {trUpper(
                `${EXAM_TITLE[examType]}${examTheme ? ` · ${examTheme.modeChip}` : ''}`,
              )}
            </Text>
          ) : null}
          {subject && subject !== 'unknown' ? (
            <Text
              style={[
                styles.metaSubject,
                examTheme ? { color: examTheme.solid } : null,
              ]}>
              {subjectLabel(subject)}
            </Text>
          ) : null}
          {topicName ? <Text style={styles.metaTopic}>{topicName}</Text> : null}
        </View>
      ) : null}

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.thumb}
          resizeMode="contain"
          accessibilityLabel="Soru görseli"
        />
      ) : null}

      {answer ? (
        <View style={styles.answerHero} testID="answer-hero">
          <Eyebrow style={styles.answerEyebrow}>{TR_EYEBROW.correctAnswer}</Eyebrow>
          <Text style={styles.answerText} accessibilityRole="header">
            {formatAnswerDisplay(answer)}
          </Text>
        </View>
      ) : null}

      <View style={styles.tabsWrap}>
        <SegmentedTabs
          items={tabs.map((t) => ({ id: t.id, label: t.label }))}
          value={tab}
          onChange={setTab}
          testID="solution-tabs"
          itemTestIDPrefix="tab"
          accentColor={examTheme?.accent ?? colors.orange}
        />
      </View>
      {tab === 'steps' ? (
        <>
          <Text style={styles.tabLead} testID="steps-lead">
            Nasıl bulduk — gerekçe
          </Text>
          {stepsOnly.map((step, index) => (
            <View
              key={`${index}-${step.title ?? ''}`}
              style={styles.card}
              testID={`step-${index}`}>
              <Text style={styles.stepTitle}>{step.title ?? `${index + 1}. Adım`}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          ))}
        </>
      ) : null}

      {tab === 'short' ? (
        <>
          <Text style={styles.tabLead} testID="short-lead">
            Tek bakışta özet
          </Text>
          <View style={styles.card} testID="short-summary">
            {answer ? (
              <Text style={styles.shortAnswer}>{formatAnswerDisplay(answer)}</Text>
            ) : null}
            <Text style={styles.stepBody}>{shortBody.replace(/^Cevap:[^\n]+\n*/i, '')}</Text>
          </View>
        </>
      ) : null}

      {tab === 'lesson' ? (
        <>
          <Text style={styles.tabLead} testID="lesson-lead">
            {topicName
              ? topicName
              : subject && subject !== 'unknown'
                ? subjectLabel(subject)
                : 'Bu konuyu hatırla'}
          </Text>
          <View
            style={[
              styles.lessonCard,
              examTheme ? { borderColor: examTheme.accent, borderWidth: 1.5 } : null,
            ]}
            testID="topic-lesson">
            {examType || (subject && subject !== 'unknown') ? (
              <Text
                style={[
                  styles.lessonExamChip,
                  examTheme ? { color: examTheme.solid } : null,
                ]}
                testID="lesson-exam-chip">
                {trUpper(
                  [
                    examType ? EXAM_TITLE[examType] : null,
                    subject && subject !== 'unknown' ? subjectLabel(subject) : null,
                    topicName,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                )}
              </Text>
            ) : null}
            {topicLesson ? (
              <>
                <Text style={styles.lessonHeadline}>{topicLesson.headline}</Text>
                <Text style={styles.lessonSummary} testID="solution-lesson-summary">
                  {topicLesson.summary}
                </Text>
                {solutionLessonBullets(topicLesson).map((b, i) => {
                  const highlight =
                    !!answer?.text &&
                    b.toLocaleLowerCase('tr-TR').includes(answer.text.toLocaleLowerCase('tr-TR'));
                  return (
                    <View
                      key={i}
                      style={[styles.bulletRow, highlight && styles.bulletHighlight]}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={[styles.stepBody, highlight && styles.bulletHighlightText]}>
                        {b}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.examCueBox} testID="solution-lesson-exam-cue">
                  <Eyebrow style={styles.tipLabel}>SINAVDA DİKKAT</Eyebrow>
                  <Text style={styles.stepBody}>{topicLesson.examCue}</Text>
                </View>
                <View style={styles.tipBox}>
                  <Eyebrow style={styles.tipLabel}>{TR_EYEBROW.tip}</Eyebrow>
                  <Text style={styles.stepBody}>{topicLesson.tip}</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.lessonHeadline}>
                  {topicName
                    ? `${examType ? `${EXAM_LABEL[examType]} · ` : ''}${topicName} — kısa hatırlatma`
                    : 'Konu anlatımı'}
                </Text>
                <Text style={styles.stepBody}>
                  Bu soru için konu özeti henüz bağlanmadı. Adım adım gerekçeyi oku; takılırsan
                  “Anlamadım” ile daha sade anlatım iste.
                </Text>
              </>
            )}
            {topicId ? (
              <Pressable
                style={styles.fullLessonLink}
                testID="open-full-topic-lesson"
                accessibilityRole="button"
                accessibilityLabel={fullLessonCtaLabel({ examType, topicName })}
                onPress={() =>
                  router.push({ pathname: '/topic/[id]', params: { id: topicId } })
                }>
                <Text style={styles.fullLessonLinkText}>
                  {fullLessonCtaLabel({ examType, topicName })}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}

      <Text style={styles.note} testID="transparency-note">
        {transparencyNote}
      </Text>

      {solutionId && onExplainAgain ? (
        <Button
          label="Anlamadım, tekrar açıkla"
          onPress={() => void handleExplain()}
          loading={loading}
          variant="secondary"
          style={styles.explainBtn}
          testID="explain-again-btn"
          haptic="medium"
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {followUp ? (
        <View style={styles.followUp} testID="follow-up-text">
          <Text style={styles.followTitle}>Daha sade anlatım</Text>
          <Text style={styles.stepBody}>{followUp}</Text>
        </View>
      ) : null}

      {onDone ? (
        <Button
          label="Tamam"
          onPress={onDone}
          testID="solution-done-btn"
          style={styles.doneBtn}
          haptic="medium"
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  heading: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
  },
  assistedBanner: {
    backgroundColor: colors.orangeSoft ?? colors.navySoft,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.orange,
  },
  assistedTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  assistedBody: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metaBand: {
    backgroundColor: colors.navySoft,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.md,
    gap: 4,
  },
  metaExam: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
    letterSpacing: 0.4,
  },
  metaSubject: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  metaTopic: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
  },
  thumb: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    marginBottom: space.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerHero: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.md,
    borderWidth: 1.5,
    borderColor: colors.orange,
    ...shadows.raised,
  },
  answerEyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  answerText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.size.display,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 34,
  },
  tabsWrap: {
    marginBottom: space.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: space.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  tabOn: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  tabLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelOn: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontWeight: '700',
  },
  tabLead: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortAnswer: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
    lineHeight: 26,
  },
  lessonCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lessonExamChip: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.orange,
    marginBottom: space.sm,
  },
  lessonHeadline: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
    lineHeight: 24,
  },
  lessonSummary: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
    marginBottom: space.md,
  },
  examCueBox: {
    marginTop: space.sm,
    marginBottom: space.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: space.sm,
    borderRadius: radii.sm,
    paddingVertical: 2,
  },
  bulletHighlight: {
    backgroundColor: colors.orangeSoft,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    marginHorizontal: -space.sm,
  },
  bulletHighlightText: {
    color: colors.navy,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
  },
  bulletDot: {
    fontFamily: typography.fontFamily,
    color: colors.orange,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 21,
  },
  tipBox: {
    marginTop: space.sm,
    backgroundColor: colors.orangeSoft,
    borderRadius: radii.md,
    padding: space.md,
  },
  tipLabel: {
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  fullLessonLink: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fullLessonLinkText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  stepTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  stepBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    flex: 1,
  },
  note: {
    fontFamily: typography.fontFamily,
    marginTop: space.sm,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  explainBtn: {
    marginTop: space.md,
  },
  error: { color: colors.danger, marginTop: space.sm },
  followUp: {
    marginTop: space.md,
    padding: space.md,
    backgroundColor: colors.orangeSoft,
    borderRadius: radii.md,
  },
  followTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  doneBtn: {
    marginTop: space.lg,
  },
});
