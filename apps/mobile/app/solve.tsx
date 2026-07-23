import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ADS_LIMITS, runInterstitialIfNeeded, runRewardedExtra } from '@/src/features/ads';
import { resolveActiveExamType } from '@/src/features/exam/resolveActiveExam';
import { useExamModeChange } from '@/src/features/exam/useExamModeChange';
import { PaywallScreen } from '@/src/features/paywall/PaywallScreen';
import {
  purchasePremiumPlan,
} from '@/src/features/paywall/billing';
import {
  hydrateEntitlement,
} from '@/src/features/paywall/entitlement';
import { isQuotaExceededError } from '@/src/features/paywall/isQuotaExceeded';
import { AnalyzingView } from '@/src/features/solve/AnalyzingView';
import type { AnalyzeStepId } from '@/src/features/solve/analyzeSteps';
import {
  advanceLiveCopy,
  liveCopyFor,
  type LiveSolveCopy,
  type LiveSolvePhase,
} from '@/src/features/solve/liveSolveCopy';
import { recordLocalAttempt } from '@/src/features/history/localHistoryStore';
import { ExamModeBlockScreen } from '@/src/features/solve/ExamModeBlockScreen';
import { SolutionScreen } from '@/src/features/solve/SolutionScreen';
import { callExplainAgain } from '@/src/features/solve/explainClient';
import { isOfflineSolutionId } from '@/src/features/solve/localSolveFallback';
import {
  releaseClaimedSolveImage,
  takePendingSolveImage,
} from '@/src/features/solve/pendingSolveImageStore';
import { callSolveQuestion } from '@/src/features/solve/solveClient';
import { solveFailureMessage } from '@/src/features/solve/solveFailureMessage';
import { routeSolveResponse } from '@/src/features/solve/solveResultRouting';
import { SOLVE_UI_SETTLE_MS } from '@/src/features/solve/solveTiming';
import { uploadQuestionImage } from '@/src/features/solve/upload';
import { withHardTimeout } from '@/src/features/solve/hardTimeout';
import { recordLocalSolveStreak } from '@/src/features/stats/localStreakStore';
import { findTopic, isKnownSubject, subjectsForExam } from '@/src/data';
import { lessonForTopic } from '@/src/data/topicLessons';
import { ensureSignedIn } from '@/src/lib/auth';
import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { colors, space, typography } from '@/src/theme';
import { Button } from '@/src/ui/Button';

function billedSolvesFromQuota(result: SolveQuestionResponse): number {
  if (result.status !== 'solved') return 0;
  if (result.quota.unlimited) return 0;
  return Math.max(0, ADS_LIMITS.freeDailySolves - result.quota.remainingToday);
}

type Phase =
  | 'analyzing'
  | 'examBlocked'
  | 'result'
  | 'error'
  | 'paywall';

export default function SolveFlowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri?: string;
    mimeType?: string;
    source?: string;
    subjectHint?: string;
    examType?: string;
  }>();
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [analyzeStep, setAnalyzeStep] = useState<AnalyzeStepId>('upload');
  const [liveSolve, setLiveSolve] = useState<LiveSolveCopy>(() => liveCopyFor('preparing'));
  const liveSolveRef = useRef<LiveSolveCopy>(liveCopyFor('preparing'));
  const [result, setResult] = useState<SolveQuestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [examType, setExamType] = useState<ExamType>('lgs');
  const [examBlock, setExamBlock] = useState<{
    active: ExamType;
    detected: ExamType;
    message: string;
    headline: string;
  } | null>(null);
  const { switching: switchingExam, applyExam } = useExamModeChange({
    onOptimistic: (next) => setExamType(next),
  });

  function bumpLive(next: LiveSolvePhase) {
    const advanced = advanceLiveCopy(liveSolveRef.current, next);
    liveSolveRef.current = advanced;
    setLiveSolve(advanced);
    setAnalyzeStep(advanced.step);
  }

  useEffect(() => {
    let cancelled = false;
    const pendingImage = takePendingSolveImage();

    async function run() {
      const imageUri =
        pendingImage?.uri ||
        (typeof params.uri === 'string' ? params.uri : '');
      const imageBase64 =
        typeof pendingImage?.base64 === 'string' && pendingImage.base64.length > 0
          ? pendingImage.base64
          : undefined;
      const mimeType = pendingImage?.mimeType || params.mimeType;
      if (!imageUri && !imageBase64) {
        setError('Görsel bulunamadı');
        setPhase('error');
        return;
      }
      try {
        liveSolveRef.current = liveCopyFor('preparing');
        bumpLive('preparing');
        const user = await ensureSignedIn();
        const resolved = await resolveActiveExamType(
          typeof params.examType === 'string' ? params.examType : null,
        );
        const resolvedExam = resolved.examType;
        setExamType(resolvedExam);
        const localId = `${Date.now()}`;
        const hintRaw = typeof params.subjectHint === 'string' ? params.subjectHint : '';
        const subjectHint: Exclude<Subject, 'unknown'> | undefined =
          isKnownSubject(hintRaw) && subjectsForExam(resolvedExam).includes(hintRaw)
            ? hintRaw
            : undefined;

        if (!cancelled) bumpLive('upload');

        const response = await withHardTimeout(
          callSolveQuestion({
            mimeType,
            examType: resolvedExam,
            subjectHint,
            requestId: localId,
            imageUri: imageUri || undefined,
            imageBase64,
            onStage: (stage) => {
              if (cancelled) return;
              bumpLive(stage);
            },
            prepareFirestore: async () => {
              if (!cancelled) bumpLive('upload');
              const { imagePath, downloadUrl } = await uploadQuestionImage({
                uid: user.uid,
                localId,
                uri: imageUri || undefined,
                base64: imageBase64,
                mimeType,
                examType: resolvedExam,
                subjectHint,
              });
              if (!cancelled) bumpLive('moderate');
              return {
                imagePath,
                imageUrl: downloadUrl,
                mimeType,
                examType: resolvedExam,
                subjectHint,
                requestId: localId,
              };
            },
          }),
          SOLVE_UI_SETTLE_MS,
          'solve UI settle',
        );
        if (cancelled) return;
        bumpLive('finishing');

        const routed = routeSolveResponse(response, resolvedExam, {
          sourceText:
            'ocrPreview' in response &&
            typeof (response as { ocrPreview?: string }).ocrPreview === 'string'
              ? (response as { ocrPreview: string }).ocrPreview
              : undefined,
        });

        if (routed.kind === 'examBlocked') {
          const modeBlock = routed.block;
          setExamBlock({
            active: modeBlock.activeExam,
            detected: modeBlock.detectedExam,
            message: modeBlock.message,
            headline: modeBlock.headline,
          });
          setPhase('examBlocked');
          return;
        }

        if (routed.kind === 'rejected') {
          setResult(routed.response);
          setPhase('result');
          return;
        }

        setResult(routed.result);
        setPhase('result');
      } catch (err) {
        if (cancelled) return;
        if (isQuotaExceededError(err)) {
          setPhase('paywall');
          return;
        }
        console.warn('solve flow used fallback or failed', err);
        setError(solveFailureMessage(err));
        setPhase('error');
      } finally {
        if (!cancelled) releaseClaimedSolveImage();
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [params.uri, params.mimeType, params.subjectHint, params.examType]);

  useEffect(() => {
    if (phase !== 'result' || !result || result.status !== 'solved') return;
    void recordLocalAttempt({
      attemptId: result.attemptId,
      solutionId: result.solutionId,
      examType,
      subject: result.subject,
      topicId: result.topicId,
      imageUri: typeof params.uri === 'string' ? params.uri : null,
      steps: result.steps,
      answer: result.answer ?? null,
      transparencyNote: result.transparencyNote,
    }).catch((err) => console.warn('local history save failed', err));
    void recordLocalSolveStreak().catch((err) =>
      console.warn('local streak bump failed', err),
    );
  }, [phase, result, examType, params.uri]);

  async function switchToDetectedExam() {
    if (!examBlock) return;
    await applyExam(examBlock.detected);
    Alert.alert(
      'Mod güncellendi',
      `${examBlock.headline}. Aynı fotoğrafı tekrar çekerek çözüm alabilirsin.`,
      [{ text: 'Tamam', onPress: () => router.replace('/(tabs)') }],
    );
  }

  if (phase === 'analyzing') {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Çözüm',
            headerBackTitle: 'Geri',
            headerStyle: { backgroundColor: colors.navy },
            headerTintColor: '#fff',
          }}
        />
        <AnalyzingView step={analyzeStep} live={liveSolve} />
      </>
    );
  }

  if (phase === 'examBlocked' && examBlock) {
    return (
      <>
        <Stack.Screen options={{ title: 'Sınav modu', headerBackTitle: 'Geri' }} />
        <ExamModeBlockScreen
          activeExam={examBlock.active}
          detectedExam={examBlock.detected}
          headline={examBlock.headline}
          message={examBlock.message}
          switching={switchingExam}
          onSwitchMode={() => void switchToDetectedExam()}
          onGoBack={() => router.replace('/(tabs)')}
        />
      </>
    );
  }

  if (phase === 'paywall') {
    return (
      <PaywallScreen
        variant="quota"
        onStart={(planId) => {
          void purchasePremiumPlan(planId).then(async (outcome) => {
            await hydrateEntitlement();
            if (outcome.ok) {
              Alert.alert(
                'Premium aktif',
                'Sınırsız çözüm ve reklamsız alan açıldı. Yeni bir soru çekebilirsin.',
                [{ text: 'Tamam', onPress: () => router.back() }],
              );
              return;
            }
            if (outcome.reason === 'user_cancelled') return;
            Alert.alert(
              'Satın alma tamamlanamadı',
              'Play Billing doğrulaması veya geliştirici sandbox gerekir.',
            );
          });
        }}
        onWatchRewarded={() => {
          void runRewardedExtra({ freeRemainingToday: 0 }).then((outcome) => {
            if (outcome.rewarded) {
              if (outcome.granted) {
                const left =
                  typeof outcome.remainingToday === 'number'
                    ? ` Kalan hak: ${outcome.remainingToday}.`
                    : '';
                Alert.alert('+1 soru hakkı', `Ödüllü reklam tamam; ekstra çözüm hakkın eklendi.${left}`);
                return;
              }
              Alert.alert(
                'Reklam tamam',
                outcome.grantReason === 'already_max'
                  ? 'Bugünkü ödüllü hak limitin doldu.'
                  : outcome.grantReason === 'premium'
                    ? 'Premium aktifken ekstra hak gerekmez.'
                    : 'Ekstra hak sunucuda kaydedilemedi. Bağlantını kontrol edip tekrar dene.',
              );
              return;
            }
            if (!outcome.offered) {
              Alert.alert('Limit', 'Bugünkü ödüllü hak hakkın doldu veya Premium aktif.');
              return;
            }
            Alert.alert('Tamamlanmadı', 'Reklam izlenmeden ekstra hak verilmedi.');
          });
        }}
        onOpenLegal={(doc) =>
          router.push({ pathname: '/settings/legal/[id]', params: { id: doc } })
        }
        onDismiss={() => router.back()}
      />
    );
  }

  if (phase === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Çözüm alınamadı</Text>
        <Text style={styles.error}>{error}</Text>
        <Button label="Ana sayfaya dön" onPress={() => router.back()} />
      </View>
    );
  }

  if (result && result.status !== 'solved') {
    const rejectMsg =
      result.userMessage?.replace(/canlı AI deploy[’']?unu bekle\.?/gi, '').trim() ||
      'Bu görseldeki işlem şu an otomatik çözülemedi. Daha net bir fotoğrafla dene.';
    return (
      <View style={styles.center} testID="solve-rejected">
        <Text style={styles.errorTitle}>Bu görsel işlenemedi</Text>
        <Text style={styles.error}>{rejectMsg}</Text>
        <Button label="Ana sayfaya dön" onPress={() => router.back()} />
      </View>
    );
  }

  if (result && result.status === 'solved') {
    const topicName = result.topicId ? findTopic(result.topicId)?.nameTr ?? null : null;
    const topicMeta = result.topicId ? findTopic(result.topicId) : undefined;
    const topicLesson = lessonForTopic(
      result.topicId,
      topicMeta
        ? {
            nameTr: topicMeta.nameTr,
            subject: topicMeta.subject,
            examType: topicMeta.examType,
          }
        : examType && result.subject && result.subject !== 'unknown'
          ? {
              nameTr: topicName ?? 'Konu',
              subject: result.subject,
              examType,
            }
          : undefined,
    );
    const canExplain = !isOfflineSolutionId(result.solutionId);
    return (
      <>
        <Stack.Screen options={{ title: 'Çözüm', headerBackTitle: 'Geri' }} />
        <SolutionScreen
          steps={result.steps}
          answer={result.answer ?? null}
          transparencyNote={result.transparencyNote ?? SAFETY_MESSAGES.transparency}
          imageUri={typeof params.uri === 'string' ? params.uri : null}
          solutionId={canExplain ? result.solutionId : null}
          examType={examType}
          subject={result.subject}
          topicId={result.topicId}
          topicName={topicName}
          topicLesson={topicLesson}
          assisted={Boolean(result.assisted)}
          onExplainAgain={
            canExplain ? () => callExplainAgain(result.solutionId) : undefined
          }
          onDone={() => {
            void (async () => {
              await runInterstitialIfNeeded({
                billedSolvesToday: billedSolvesFromQuota(result),
                atNaturalBreak: true,
              });
              router.back();
            })();
          }}
        />
      </>
    );
  }

  return null;
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
});
