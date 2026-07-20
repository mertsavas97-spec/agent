import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { findTopic, subjectLabel } from '@/src/data';
import { lessonForTopic } from '@/src/data/topicLessons';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { colors, space, typography } from '@/src/theme';
import { SegmentedTabs } from '@/src/ui/SegmentedTabs';

import { SolutionScreen } from './SolutionScreen';
import { isOfflineSolutionId } from './localSolveFallback';

export type MultiSlotStatus = 'pending' | 'solving' | 'ready' | 'error';

export type MultiSolveSlot = {
  id: string;
  status: MultiSlotStatus;
  imageUri: string;
  /** Per-question exam package (may differ from profile after OCR hint). */
  examType?: ExamType;
  result?: SolveQuestionResponse;
  errorMessage?: string;
};

export type MultiSolutionScreenProps = {
  slots: MultiSolveSlot[];
  activeId: string;
  onChangeActive: (id: string) => void;
  examType: ExamType;
  onExplainAgain?: (solutionId: string) => Promise<string>;
  onDone?: () => void;
};

function slotExam(slot: MultiSolveSlot, fallback: ExamType): ExamType {
  return slot.examType ?? fallback;
}

function slotCaption(slot: MultiSolveSlot, fallback: ExamType): string {
  if (slot.status === 'error') return 'Hata';
  if (slot.status === 'solving') return '…';
  if (slot.status === 'pending') return 'Sırada';
  const exam = EXAM_LABEL[slotExam(slot, fallback)];
  if (slot.result?.status === 'solved' && slot.result.subject !== 'unknown') {
    return `${exam} · ${subjectLabel(slot.result.subject)}`;
  }
  return exam;
}

function ReadyPane({
  slot,
  examType,
  onExplainAgain,
  onDone,
}: {
  slot: MultiSolveSlot;
  examType: ExamType;
  onExplainAgain?: (solutionId: string) => Promise<string>;
  onDone?: () => void;
}) {
  const result = slot.result;
  if (!result || result.status !== 'solved') return null;
  const activeExam = slotExam(slot, examType);

  return (
    <SolutionScreen
      steps={result.steps}
      answer={result.answer ?? null}
      transparencyNote={result.transparencyNote ?? SAFETY_MESSAGES.transparency}
      imageUri={slot.imageUri}
      solutionId={isOfflineSolutionId(result.solutionId) ? null : result.solutionId}
      examType={activeExam}
      subject={result.subject}
      topicId={result.topicId}
      topicName={result.topicId ? findTopic(result.topicId)?.nameTr ?? null : null}
      topicLesson={lessonForTopic(
        result.topicId,
        result.subject && result.subject !== 'unknown'
          ? {
              nameTr:
                (result.topicId ? findTopic(result.topicId)?.nameTr : null) ?? 'Konu',
              subject: result.subject as Exclude<Subject, 'unknown'>,
              examType: activeExam,
            }
          : undefined,
      )}
      onExplainAgain={
        onExplainAgain &&
        result.solutionId &&
        !isOfflineSolutionId(result.solutionId)
          ? () => onExplainAgain(result.solutionId)
          : undefined
      }
      onDone={onDone}
    />
  );
}

export function MultiSolutionScreen({
  slots,
  activeId,
  onChangeActive,
  examType,
  onExplainAgain,
  onDone,
}: MultiSolutionScreenProps) {
  const active = slots.find((s) => s.id === activeId) ?? slots[0];
  const readyCount = slots.filter((s) => s.status === 'ready').length;

  const tabItems = slots.map((s, i) => ({
    id: s.id,
    label: `Soru ${i + 1}`,
    caption: slotCaption(s, examType),
  }));

  return (
    <View style={styles.root} testID="multi-solution-screen">
      <View style={styles.headerBlock}>
        <Text style={styles.batchMeta} testID="multi-batch-progress">
          {readyCount}/{slots.length} hazır
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}>
          <View style={styles.tabsInner}>
            <SegmentedTabs
              items={tabItems}
              value={active?.id ?? null}
              onChange={onChangeActive}
              testID="multi-question-tabs"
              itemTestIDPrefix="multi-q"
              variant="track"
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.panes}>
        {slots.map((slot) => {
          const isActive = slot.id === (active?.id ?? '');
          if (slot.status === 'ready' && slot.result?.status === 'solved') {
            return (
              <View
                key={slot.id}
                style={[styles.pane, isActive ? styles.paneActive : styles.paneHidden]}
                pointerEvents={isActive ? 'auto' : 'none'}
                testID={isActive ? 'multi-active-ready' : `multi-ready-${slot.id}`}
                accessibilityElementsHidden={!isActive}
                importantForAccessibility={isActive ? 'yes' : 'no-hide-descendants'}>
                <ReadyPane
                  slot={slot}
                  examType={examType}
                  onExplainAgain={onExplainAgain}
                  onDone={onDone}
                />
              </View>
            );
          }
          if (!isActive) return null;
          if (slot.status === 'error') {
            return (
              <View key={slot.id} style={styles.center} testID="multi-slot-error">
                <Text style={styles.errorTitle}>Bu soru çözülemedi</Text>
                <Text style={styles.errorBody}>
                  {slot.errorMessage ?? 'Tekrar dene veya tekli çekim kullan.'}
                </Text>
              </View>
            );
          }
          return (
            <View key={slot.id} style={styles.center} testID="multi-slot-loading">
              <ActivityIndicator color={colors.orange} size="large" />
              <Text style={styles.loadingTitle}>Bu soru hazırlanıyor</Text>
              <Text style={styles.loadingBody}>
                Diğer sekmelerdeki hazır cevaplara geçebilirsin — bu arada arka planda
                devam ediyoruz.
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerBlock: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    backgroundColor: colors.surface,
    gap: space.sm,
  },
  batchMeta: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  tabsScroll: {
    flexGrow: 1,
  },
  tabsInner: {
    minWidth: '100%',
    flexGrow: 1,
  },
  panes: {
    flex: 1,
    position: 'relative',
  },
  pane: {
    ...StyleSheet.absoluteFillObject,
  },
  paneActive: {
    opacity: 1,
    zIndex: 2,
  },
  paneHidden: {
    opacity: 0,
    zIndex: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  loadingTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    color: colors.navy,
    textAlign: 'center',
  },
  loadingBody: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    color: colors.navy,
  },
  errorBody: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
