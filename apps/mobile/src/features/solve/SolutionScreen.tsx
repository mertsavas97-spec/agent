import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { subjectLabel } from '@/src/data';
import type { TopicLesson } from '@/src/data/topicLessons';
import type {
  ExamType,
  SolutionAnswer,
  SolutionStep,
  Subject,
} from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { colors, radii, space, typography } from '@/src/theme';

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
  topicName?: string | null;
  topicLesson?: TopicLesson | null;
  onExplainAgain?: () => Promise<string>;
  onDone?: () => void;
};

const EXAM_TITLE: Record<ExamType, string> = {
  lgs: 'LGS',
  ygs: 'YGS (YKS)',
  kpss: 'KPSS',
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
  topicName,
  topicLesson,
  onExplainAgain,
  onDone,
}: SolutionScreenProps) {
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('steps');

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="solution-screen">
      <Text style={styles.heading}>Çözüm</Text>

      {(examType || subject || topicName) && (
        <View style={styles.metaBand} testID="solution-meta">
          {examType ? <Text style={styles.metaExam}>{EXAM_TITLE[examType]}</Text> : null}
          {subject && subject !== 'unknown' ? (
            <Text style={styles.metaSubject}>{subjectLabel(subject)}</Text>
          ) : null}
          {topicName ? <Text style={styles.metaTopic}>{topicName}</Text> : null}
        </View>
      )}

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
          <Text style={styles.answerEyebrow}>Doğru cevap</Text>
          <Text style={styles.answerText} accessibilityRole="header">
            {formatAnswerDisplay(answer)}
          </Text>
        </View>
      ) : null}

      <View style={styles.tabs} testID="solution-tabs">
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabOn]}
            onPress={() => setTab(t.id)}
            testID={t.testID}>
            <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelOn]} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        ))}
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
            Bu konuyu hatırla
          </Text>
          <View style={styles.lessonCard} testID="topic-lesson">
            {topicLesson ? (
              <>
                <Text style={styles.lessonHeadline}>{topicLesson.headline}</Text>
                {topicLesson.bullets.map((b, i) => {
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
                <View style={styles.tipBox}>
                  <Text style={styles.tipLabel}>İpucu</Text>
                  <Text style={styles.stepBody}>{topicLesson.tip}</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.lessonHeadline}>
                  {topicName ? `${topicName} — kısa hatırlatma` : 'Konu anlatımı'}
                </Text>
                <Text style={styles.stepBody}>
                  Bu soru için konu özeti henüz bağlanmadı. Adım adım gerekçeyi oku; takılırsan
                  “Anlamadım” ile daha sade anlatım iste.
                </Text>
              </>
            )}
          </View>
        </>
      ) : null}

      <Text style={styles.note} testID="transparency-note">
        {transparencyNote}
      </Text>

      {solutionId && onExplainAgain ? (
        <Pressable
          style={styles.explainBtn}
          onPress={() => void handleExplain()}
          disabled={loading}
          testID="explain-again-btn">
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.explainLabel}>Anlamadım, tekrar açıkla</Text>
          )}
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {followUp ? (
        <View style={styles.followUp} testID="follow-up-text">
          <Text style={styles.followTitle}>Daha sade anlatım</Text>
          <Text style={styles.stepBody}>{followUp}</Text>
        </View>
      ) : null}

      {onDone ? (
        <Pressable
          style={styles.doneBtn}
          onPress={onDone}
          testID="solution-done-btn"
          accessibilityRole="button">
          <Text style={styles.doneLabel}>Tamam</Text>
        </Pressable>
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
    textTransform: 'uppercase',
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
  },
  answerEyebrow: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.orange,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  answerText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 32,
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
  lessonHeadline: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.md,
    lineHeight: 24,
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
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.orange,
    fontSize: 12,
    marginBottom: 4,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  explainLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.white,
    fontWeight: '700',
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
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.navy,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    color: colors.navy,
  },
});
