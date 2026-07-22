import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

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

  useEffect(() => {
    let cancelled = false;
    const pendingImage = takePendingSolveImage();

    async function run() {
      const imageUri =
        pendingImage?.uri ||
        (typeof params.uri === 'string' ? params.uri : '');
      const mimeType = pendingImage?.mimeType || params.mimeType;
      if (!imageUri) {
        setError('Görsel bulunamadı');
        setPhase('error');
        return;
      }
      try {
        setAnalyzeStep('upload');
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

        setAnalyzeStep('moderate');
        // UI beat only — do not delay the Firestore/Storage wait behind this.
        const moderateBeat = new Promise((r) => setTimeout(r, 280));
        setAnalyzeStep('solve');

        const solvePromise = withHardTimeout(
          callSolveQuestion({
            mimeType,
            examType: resolvedExam,
            subjectHint,
            requestId: localId,
            imageUri,
            prepareFirestore: async () => {
              const { imagePath, downloadUrl } = await uploadQuestionImage({
                uid: user.uid,
                localId,
                uri: imageUri,
                mimeType,
                examType: resolvedExam,
                subjectHint,
              });
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
        await moderateBeat;
        let response = await solvePromise;
        if (cancelled) return;

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
        <Stack.Screen options={{ title: 'Çözüm', headerBackTitle: 'Geri' }} />
        <AnalyzingView step={analyzeStep} />
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
              Alert.alert(
                '+1 soru hakkı',
                'Ödüllü reklam tamam. Sunucu grant sonraki adımda bağlanacak; şimdilik sandbox onayı.',
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
        <Pressable onPress={() => router.back()} style={styles.btn}>
          <Text style={styles.btnText}>Ana sayfaya dön</Text>
        </Pressable>
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
        <Pressable onPress={() => router.back()} style={styles.btn}>
          <Text style={styles.btnText}>Ana sayfaya dön</Text>
        </Pressable>
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
