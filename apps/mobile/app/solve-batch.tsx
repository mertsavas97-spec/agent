import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ADS_LIMITS, runInterstitialIfNeeded } from '@/src/features/ads';
import { EXAM_LABEL } from '@/src/features/exam/examLabels';
import { resolveActiveExamType } from '@/src/features/exam/resolveActiveExam';
import { recordLocalAttempt } from '@/src/features/history/localHistoryStore';
import { AnalyzingView } from '@/src/features/solve/AnalyzingView';
import {
  MultiSolutionScreen,
  type MultiSolveSlot,
} from '@/src/features/solve/MultiSolutionScreen';
import { callExplainAgain } from '@/src/features/solve/explainClient';
import { uriToBase64 } from '@/src/features/solve/imageBase64';
import { takePendingMultiBatch } from '@/src/features/solve/multiBatchStore';
import { callSolveQuestion } from '@/src/features/solve/solveClient';
import { solveFailureMessage } from '@/src/features/solve/solveFailureMessage';
import { shouldConfirmExamMismatch } from '@/src/features/solve/subjectClassification';
import { uploadQuestionImage } from '@/src/features/solve/upload';
import { ensureSignedIn } from '@/src/lib/auth';
import type { ExamType, SolveQuestionResponse } from '@/src/lib/api/types';
import { colors, space, typography } from '@/src/theme';

const SOLVE_CONCURRENCY = 2;

function billedSolvesFromQuota(result: SolveQuestionResponse): number {
  if (result.status !== 'solved') return 0;
  if (result.quota.unlimited) return 0;
  return Math.max(0, ADS_LIMITS.freeDailySolves - result.quota.remainingToday);
}

function examHintFromResponse(response: SolveQuestionResponse) {
  return 'examHint' in response ? response.examHint : undefined;
}

export default function SolveBatchScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<'boot' | 'analyzing' | 'results' | 'error'>('boot');
  const [examType, setExamType] = useState<ExamType>('lgs');
  const [slots, setSlots] = useState<MultiSolveSlot[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const batch = takePendingMultiBatch();
    if (!batch || batch.images.length === 0) {
      setError('Çoklu soru seçilmedi');
      setPhase('error');
      return;
    }

    const initial: MultiSolveSlot[] = batch.images.map((img, i) => ({
      id: `q-${i}-${Date.now()}`,
      status: 'pending',
      imageUri: img.uri,
      examType: batch.examType,
    }));
    setSlots(initial);
    setActiveId(initial[0]!.id);
    setPhase('analyzing');

    void (async () => {
      try {
        const user = await ensureSignedIn();
        const { examType: resolvedExam } = await resolveActiveExamType(
          batch.examType ?? null,
        );
        setExamType(resolvedExam);

        const subjectHint = batch.subjectHint;
        let cursor = 0;
        let ready = 0;

        const patchSlot = (id: string, patch: Partial<MultiSolveSlot>) => {
          setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
        };

        const runOne = async (slot: MultiSolveSlot, index: number) => {
          if (cancelledRef.current) return;
          patchSlot(slot.id, { status: 'solving', examType: resolvedExam });
          setStatusLine(`Soru ${index + 1}/${initial.length} çözülüyor…`);
          try {
            const localId = `${Date.now()}-${index}`;
            const img = batch.images[index]!;
            const { imagePath, downloadUrl } = await uploadQuestionImage({
              uid: user.uid,
              localId,
              uri: img.uri,
              mimeType: img.mimeType,
              examType: resolvedExam,
              subjectHint,
            });
            if (cancelledRef.current) return;
            const imageBase64 = await uriToBase64(img.uri);
            if (cancelledRef.current) return;

            let examForSolve: ExamType = resolvedExam;
            let response = await callSolveQuestion({
              imagePath,
              mimeType: img.mimeType,
              examType: examForSolve,
              subjectHint,
              requestId: localId,
              imageUrl: downloadUrl,
              imageBase64: imageBase64 ?? undefined,
            });
            if (cancelledRef.current) return;

            // Per-question exam: OCR says another package → re-solve without popup.
            const hint = examHintFromResponse(response);
            if (shouldConfirmExamMismatch(hint, examForSolve) && hint?.suggested) {
              const suggested = hint.suggested;
              setStatusLine(
                `Soru ${index + 1}: ${EXAM_LABEL[suggested]} algılandı, yeniden…`,
              );
              response = await callSolveQuestion({
                imagePath,
                mimeType: img.mimeType,
                examType: suggested,
                subjectHint,
                requestId: `${localId}-re`,
                imageUrl: downloadUrl,
                imageBase64: imageBase64 ?? undefined,
              });
              examForSolve = suggested;
              if (cancelledRef.current) return;
            }

            if (response.status === 'solved') {
              patchSlot(slot.id, {
                status: 'ready',
                result: response,
                examType: examForSolve,
              });
              void recordLocalAttempt({
                attemptId: response.attemptId,
                solutionId: response.solutionId,
                examType: examForSolve,
                subject: response.subject,
                topicId: response.topicId,
                imageUri: img.uri,
                steps: response.steps,
                answer: response.answer ?? null,
                transparencyNote: response.transparencyNote,
              }).catch((err) => console.warn('local history save failed', err));
              ready += 1;
              setStatusLine(`${ready}/${initial.length} hazır`);
              if (!openedRef.current) {
                openedRef.current = true;
                setActiveId(slot.id);
                setPhase('results');
              }
            } else {
              patchSlot(slot.id, {
                status: 'error',
                errorMessage: response.userMessage,
                result: response,
                examType: examForSolve,
              });
            }
          } catch (err) {
            patchSlot(slot.id, {
              status: 'error',
              errorMessage: solveFailureMessage(err),
              examType: resolvedExam,
            });
          }
        };

        const workers = Array.from(
          { length: Math.min(SOLVE_CONCURRENCY, initial.length) },
          async () => {
            while (cursor < initial.length) {
              const i = cursor;
              cursor += 1;
              await runOne(initial[i]!, i);
            }
          },
        );
        await Promise.all(workers);

        if (cancelledRef.current) return;
        if (!openedRef.current) {
          setPhase('results');
        }
        setStatusLine(null);
      } catch (err) {
        if (cancelledRef.current) return;
        setError(solveFailureMessage(err));
        setPhase('error');
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  if (phase === 'error') {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Çoklu çözüm', headerBackTitle: 'Geri' }} />
        <Text style={styles.errorTitle}>Çözüm alınamadı</Text>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => router.back()} style={styles.btn}>
          <Text style={styles.btnText}>Ana sayfaya dön</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'analyzing' || phase === 'boot') {
    return (
      <>
        <Stack.Screen options={{ title: 'Çoklu çözüm', headerBackTitle: 'Geri' }} />
        <AnalyzingView step="solve" statusLine={statusLine} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Çoklu çözüm', headerBackTitle: 'Geri' }} />
      <MultiSolutionScreen
        slots={slots}
        activeId={activeId}
        onChangeActive={setActiveId}
        examType={examType}
        onExplainAgain={(solutionId) => callExplainAgain(solutionId)}
        onDone={() => {
          void (async () => {
            const firstReady = slots.find(
              (s) => s.status === 'ready' && s.result?.status === 'solved',
            );
            const billed =
              firstReady?.result && firstReady.result.status === 'solved'
                ? billedSolvesFromQuota(firstReady.result)
                : 0;
            await runInterstitialIfNeeded({
              billedSolvesToday: billed,
              atNaturalBreak: true,
            });
            router.back();
          })();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: space.lg,
    backgroundColor: colors.surface,
  },
  error: {
    color: colors.textSecondary,
    marginBottom: space.md,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
    lineHeight: 20,
  },
  errorTitle: {
    color: colors.navy,
    fontSize: 18,
    fontFamily: typography.fontFamilySemiBold,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  btn: {
    alignSelf: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: 12,
  },
  btnText: {
    color: colors.white,
    fontWeight: '600',
    fontFamily: typography.fontFamilySemiBold,
  },
});
