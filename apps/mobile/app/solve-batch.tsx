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
import {
  releaseClaimedMultiBatch,
  takePendingMultiBatch,
} from '@/src/features/solve/multiBatchStore';
import { callSolveQuestion } from '@/src/features/solve/solveClient';
import { solveFailureMessage } from '@/src/features/solve/solveFailureMessage';
import { shouldConfirmExamMismatch } from '@/src/features/solve/subjectClassification';
import { uploadQuestionImage } from '@/src/features/solve/upload';
import { ensureSignedIn } from '@/src/lib/auth';
import type {
  ExamHintMeta,
  ExamType,
  SolveQuestionResponse,
} from '@/src/lib/api/types';
import { colors, space, typography } from '@/src/theme';

/** Sequential — avoids Vision OCR races that leave Q2+ as generic fallback. */
const SOLVE_CONCURRENCY = 1;

function billedSolvesFromQuota(result: SolveQuestionResponse): number {
  if (result.status !== 'solved') return 0;
  if (result.quota.unlimited) return 0;
  return Math.max(0, ADS_LIMITS.freeDailySolves - result.quota.remainingToday);
}

function examHintFromResponse(
  response: SolveQuestionResponse,
): ExamHintMeta | undefined {
  return 'examHint' in response ? response.examHint : undefined;
}

function responseHasAnswer(response: SolveQuestionResponse): boolean {
  if (response.status !== 'solved') return false;
  if (response.answer?.text?.trim()) return true;
  return response.steps.some((s) =>
    /^(cevap|sonuç|doğru)/i.test((s.title ?? '').trim()),
  );
}

/** Infer package from subject/topic when proxy auto-switched exam. */
function examFromSolved(
  response: Extract<SolveQuestionResponse, { status: 'solved' }>,
  fallback: ExamType,
): ExamType {
  if (
    response.subject === 'traffic' ||
    response.subject === 'vehicle' ||
    response.subject === 'firstaid'
  ) {
    return 'trafik';
  }
  const tid = response.topicId ?? '';
  if (tid.startsWith('lgs-')) return 'lgs';
  if (tid.startsWith('ygs-')) return 'ygs';
  if (tid.startsWith('kpss-')) return 'kpss';
  if (tid.startsWith('trafik-')) return 'trafik';
  if (response.examHint?.suggested && !response.examHint.mismatchesProfile) {
    return response.examHint.suggested;
  }
  return fallback;
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
  const runIdRef = useRef(0);

  useEffect(() => {
    cancelledRef.current = false;
    const runId = ++runIdRef.current;
    const batch = takePendingMultiBatch();
    if (!batch || batch.images.length === 0) {
      setError('Çoklu soru seçilmedi');
      setPhase('error');
      return;
    }

    const stamp = Date.now();
    const initial: MultiSolveSlot[] = batch.images.map((img, i) => ({
      id: `q-${i}-${stamp}`,
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
        if (cancelledRef.current || runId !== runIdRef.current) return;

        const { examType: resolvedExam } = await resolveActiveExamType(
          batch.examType ?? null,
        );
        setExamType(resolvedExam);

        // Per-photo auto-detect — do not force a shared ders ipucu on the whole batch.
        let cursor = 0;
        let ready = 0;

        const patchSlot = (id: string, patch: Partial<MultiSolveSlot>) => {
          if (cancelledRef.current || runId !== runIdRef.current) return;
          setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
        };

        const solveWithExam = async (
          img: (typeof batch.images)[number],
          index: number,
          examForSolve: ExamType,
          requestId: string,
        ) => {
          const { imagePath, downloadUrl } = await uploadQuestionImage({
            uid: user.uid,
            localId: requestId,
            uri: img.uri,
            mimeType: img.mimeType,
            examType: examForSolve,
          });
          if (cancelledRef.current || runId !== runIdRef.current) return null;
          const imageBase64 = await uriToBase64(img.uri);
          if (cancelledRef.current || runId !== runIdRef.current) return null;
          return callSolveQuestion({
            imagePath,
            mimeType: img.mimeType,
            examType: examForSolve,
            requestId,
            imageUrl: downloadUrl,
            imageBase64: imageBase64 ?? undefined,
          });
        };

        const runOne = async (slot: MultiSolveSlot, index: number) => {
          if (cancelledRef.current || runId !== runIdRef.current) return;
          patchSlot(slot.id, { status: 'solving', examType: resolvedExam });
          setStatusLine(`Soru ${index + 1}/${initial.length} çözülüyor…`);
          try {
            const img = batch.images[index]!;
            const baseId = `${stamp}-${index}-${Math.random().toString(36).slice(2, 8)}`;
            let examForSolve: ExamType = resolvedExam;
            let response = await solveWithExam(img, index, examForSolve, baseId);
            if (!response || cancelledRef.current || runId !== runIdRef.current) return;

            // OCR suggests another package → re-solve once with that exam.
            const hint = examHintFromResponse(response);
            if (shouldConfirmExamMismatch(hint, examForSolve) && hint?.suggested) {
              const suggested = hint.suggested;
              setStatusLine(
                `Soru ${index + 1}: ${EXAM_LABEL[suggested]} algılandı, yeniden…`,
              );
              const again = await solveWithExam(
                img,
                index,
                suggested,
                `${baseId}-re`,
              );
              if (!again || cancelledRef.current || runId !== runIdRef.current) return;
              response = again;
              examForSolve = suggested;
            }

            // Still no answer but OCR named another exam — last chance re-solve.
            const hint2 = examHintFromResponse(response);
            if (
              !responseHasAnswer(response) &&
              hint2?.suggested &&
              hint2.suggested !== examForSolve &&
              (hint2.confidence === 'high' || hint2.confidence === 'medium')
            ) {
              const suggested = hint2.suggested;
              setStatusLine(
                `Soru ${index + 1}: ${EXAM_LABEL[suggested]} ile tekrar…`,
              );
              const again = await solveWithExam(
                img,
                index,
                suggested,
                `${baseId}-re2`,
              );
              if (!again || cancelledRef.current || runId !== runIdRef.current) return;
              response = again;
              examForSolve = suggested;
            }

            if (response.status === 'solved') {
              const slotExam = examFromSolved(response, examForSolve);
              patchSlot(slot.id, {
                status: 'ready',
                result: response,
                examType: slotExam,
              });
              void recordLocalAttempt({
                attemptId: response.attemptId,
                solutionId: response.solutionId,
                examType: slotExam,
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

        if (cancelledRef.current || runId !== runIdRef.current) return;
        if (!openedRef.current) {
          setPhase('results');
        }
        setStatusLine(null);
        releaseClaimedMultiBatch();
      } catch (err) {
        if (cancelledRef.current || runId !== runIdRef.current) return;
        setError(solveFailureMessage(err));
        setPhase('error');
        releaseClaimedMultiBatch();
      }
    })();

    return () => {
      // Only cancel if a newer run replaced us (Strict Mode remount bumps runId).
      if (runIdRef.current === runId) {
        // Soft cancel: do not flip cancelled for the same claim remount.
        // Hard cancel only when screen truly leaves — handled below via runId bump.
      }
      cancelledRef.current = true;
    };
  }, []);

  // Soften Strict Mode: second mount bumps runId and retakes claimed batch.
  // First mount's cleanup sets cancelled — second mount resets it at effect start.

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
