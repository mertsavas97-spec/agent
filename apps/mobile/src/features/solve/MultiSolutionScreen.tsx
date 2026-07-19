import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { findTopic } from '@/src/data';
import { lessonForTopic } from '@/src/data/topicLessons';
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
    caption:
      s.status === 'ready'
        ? 'Hazır'
        : s.status === 'error'
          ? 'Hata'
          : s.status === 'solving'
            ? '…'
            : 'Sırada',
  }));

  return (
    <View style={styles.root} testID="multi-solution-screen">
      <View style={styles.headerBlock}>
        <Text style={styles.batchMeta} testID="multi-batch-progress">
          {readyCount}/{slots.length} hazır
        </Text>
        <SegmentedTabs
          items={tabItems}
          value={active?.id ?? null}
          onChange={onChangeActive}
          testID="multi-question-tabs"
          itemTestIDPrefix="multi-q"
          variant="track"
        />
      </View>

      {!active ? null : active.status === 'ready' &&
        active.result &&
        active.result.status === 'solved' ? (
        <View style={styles.solutionPane}>
          <SolutionScreen
            steps={active.result.steps}
            answer={active.result.answer ?? null}
            transparencyNote={
              active.result.transparencyNote ?? SAFETY_MESSAGES.transparency
            }
            imageUri={active.imageUri}
            solutionId={
              isOfflineSolutionId(active.result.solutionId)
                ? null
                : active.result.solutionId
            }
            examType={examType}
            subject={active.result.subject}
            topicName={
              active.result.topicId
                ? findTopic(active.result.topicId)?.nameTr ?? null
                : null
            }
            topicLesson={lessonForTopic(
              active.result.topicId,
              active.result.subject && active.result.subject !== 'unknown'
                ? {
                    nameTr:
                      (active.result.topicId
                        ? findTopic(active.result.topicId)?.nameTr
                        : null) ?? 'Konu',
                    subject: active.result.subject as Exclude<Subject, 'unknown'>,
                    examType,
                  }
                : undefined,
            )}
            onExplainAgain={
              onExplainAgain &&
              active.result.status === 'solved' &&
              active.result.solutionId &&
              !isOfflineSolutionId(active.result.solutionId)
                ? () => {
                    const sol = active.result;
                    if (sol && sol.status === 'solved') {
                      return onExplainAgain(sol.solutionId);
                    }
                    return Promise.resolve('');
                  }
                : undefined
            }
            onDone={onDone}
          />
        </View>
      ) : active.status === 'error' ? (
        <View style={styles.center} testID="multi-slot-error">
          <Text style={styles.errorTitle}>Bu soru çözülemedi</Text>
          <Text style={styles.errorBody}>
            {active.errorMessage ?? 'Tekrar dene veya tekli çekim kullan.'}
          </Text>
        </View>
      ) : (
        <View style={styles.center} testID="multi-slot-loading">
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={styles.loadingTitle}>Bu soru hazırlanıyor</Text>
          <Text style={styles.loadingBody}>
            Diğer sekmelerdeki hazır cevaplara geçebilirsin — bu arada arka planda devam
            ediyoruz.
          </Text>
        </View>
      )}
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
    fontSize: 12,
    color: colors.textMuted,
  },
  solutionPane: { flex: 1 },
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
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    color: colors.navy,
  },
  errorBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
