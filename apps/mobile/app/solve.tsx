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
import { uploadQuestionImage } from '@/src/features/solve/upload';
import { ensureSignedIn } from '@/src/lib/auth';
import type { SolveQuestionResponse } from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { colors, space } from '@/src/theme';

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
  }>();
  const [phase, setPhase] = useState<'analyzing' | 'result' | 'error' | 'paywall'>(
    'analyzing',
  );
  const [analyzeStep, setAnalyzeStep] = useState<AnalyzeStepId>('upload');
  const [result, setResult] = useState<SolveQuestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const localId = `${Date.now()}`;
        const { imagePath } = await uploadQuestionImage({
          uid: user.uid,
          localId,
          uri: params.uri,
          mimeType: params.mimeType,
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
        setError('Çözüm şu an üretilemedi. Tekrar dener misin?');
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
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => router.back()} style={styles.btn}>
          <Text style={styles.btnText}>Geri</Text>
        </Pressable>
      </View>
    );
  }

  if (result && result.status !== 'solved') {
    return (
      <View style={styles.center} testID="solve-rejected">
        <Text style={styles.error}>{result.userMessage}</Text>
        <Pressable onPress={() => router.back()} style={styles.btn}>
          <Text style={styles.btnText}>Tamam</Text>
        </Pressable>
      </View>
    );
  }

  if (result && result.status === 'solved') {
    return (
      <SolutionScreen
        steps={result.steps}
        transparencyNote={result.transparencyNote ?? SAFETY_MESSAGES.transparency}
        imageUri={typeof params.uri === 'string' ? params.uri : null}
        solutionId={result.solutionId}
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
    color: colors.danger,
    marginBottom: space.md,
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
  },
});
