import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ADS_LIMITS, runInterstitialIfNeeded, runRewardedExtra } from '@/src/features/ads';
import { PaywallScreen } from '@/src/features/paywall/PaywallScreen';
import { startPremiumPurchase } from '@/src/features/paywall/entitlement';
import { isQuotaExceededError } from '@/src/features/paywall/isQuotaExceeded';
import { AnalyzingView } from '@/src/features/solve/AnalyzingView';
import type { AnalyzeStepId } from '@/src/features/solve/analyzeSteps';
import { SolutionScreen } from '@/src/features/solve/SolutionScreen';
import { callExplainAgain } from '@/src/features/solve/explainClient';
import { callSolveQuestion } from '@/src/features/solve/solveClient';
import { solveFailureMessage } from '@/src/features/solve/solveFailureMessage';
import { uploadQuestionImage } from '@/src/features/solve/upload';
import { findTopic } from '@/src/data';
import { lessonForTopic } from '@/src/data/topicLessons';
import { ensureSignedIn } from '@/src/lib/auth';
import { isKnownSubject, subjectsForExam } from '@/src/data';
import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { colors, space, typography } from '@/src/theme';
import { doc, getDoc } from 'firebase/firestore';

function billedSolvesFromQuota(result: SolveQuestionResponse): number {
  if (result.quota.unlimited) return 0;
  return Math.max(0, ADS_LIMITS.freeDailySolves - result.quota.remainingToday);
}

export default function SolveFlowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri?: string;
    mimeType?: string;
    source?: string;
    subjectHint?: string;
  }>();
  const [phase, setPhase] = useState<'analyzing' | 'result' | 'error' | 'paywall'>(
    'analyzing',
  );
  const [analyzeStep, setAnalyzeStep] = useState<AnalyzeStepId>('upload');
  const [result, setResult] = useState<SolveQuestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [examType, setExamType] = useState<ExamType | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!params.uri) {
        setError('Görsel bulunamadı');
        setPhase('error');
        return;
      }
      try {
        // Camera and gallery share the identical pipeline from here.
        setAnalyzeStep('upload');
        const user = await ensureSignedIn();
        let resolvedExam: ExamType = 'lgs';
        try {
          const snap = await getDoc(doc(getFirebase().db, 'users', user.uid));
          const et = snap.data()?.examType;
          if (et === 'lgs' || et === 'ygs' || et === 'kpss') {
            resolvedExam = et;
            setExamType(et);
          }
        } catch {
          /* optional */
        }
        const localId = `${Date.now()}`;
        const hintRaw = typeof params.subjectHint === 'string' ? params.subjectHint : '';
        const subjectHint: Subject | undefined =
          isKnownSubject(hintRaw) && subjectsForExam(resolvedExam).includes(hintRaw)
            ? hintRaw
            : undefined;

        // Upload first (tags cozbilSolve=1) → Storage Gen2 trigger solves.
        const { imagePath } = await uploadQuestionImage({
          uid: user.uid,
          localId,
          uri: params.uri,
          mimeType: params.mimeType,
          examType: resolvedExam,
          subjectHint,
        });
        if (cancelled) return;

        // Server applies SafeSearch + solve; UI shows moderate then solve stages.
        setAnalyzeStep('moderate');
        // Brief tick so progress bar is visible before the long AI call.
        await new Promise((r) => setTimeout(r, 280));
        if (cancelled) return;
        setAnalyzeStep('solve');

        const response = await callSolveQuestion({
          imagePath,
          mimeType: params.mimeType,
          examType: resolvedExam,
          subjectHint,
          requestId: localId,
        });
        if (cancelled) return;
        setResult(response);
        setPhase('result');
      } catch (err) {
        if (cancelled) return;
        if (isQuotaExceededError(err)) {
          setPhase('paywall');
          return;
        }
        console.error('solve flow failed', err);
        setError(solveFailureMessage(err));
        setPhase('error');
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [params.uri, params.mimeType]);

  if (phase === 'analyzing') {
    return <AnalyzingView step={analyzeStep} />;
  }

  if (phase === 'paywall') {
    return (
      <PaywallScreen
        onStart={(planId) => {
          void startPremiumPurchase(planId).then((outcome) => {
            if (outcome.ok) {
              Alert.alert(
                'Premium (sandbox)',
                `Sandbox abonelik aktif (${outcome.productId}). Sunucu entitlement senkronu sonraki adımda bağlanacak.`,
              );
              return;
            }
            Alert.alert(
              'Yakında',
              'Google Play Billing henüz bu derlemede bağlı değil. License tester sandbox için quickstart notuna bak.',
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
    return (
      <View style={styles.center} testID="solve-rejected">
        <Text style={styles.errorTitle}>Bu görsel işlenemedi</Text>
        <Text style={styles.error}>{result.userMessage}</Text>
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
            : examType && result.subject
              ? {
                  nameTr: topicName ?? 'Konu',
                  subject: result.subject,
                  examType,
                }
              : undefined,
        );
        return (
          <SolutionScreen
            steps={result.steps}
            transparencyNote={result.transparencyNote ?? SAFETY_MESSAGES.transparency}
            imageUri={typeof params.uri === 'string' ? params.uri : null}
            solutionId={result.solutionId}
            examType={examType}
            subject={result.subject}
            topicName={topicName}
            topicLesson={topicLesson}
            onExplainAgain={() => callExplainAgain(result.solutionId)}
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
