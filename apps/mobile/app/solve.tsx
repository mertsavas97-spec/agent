import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnalyzingView } from '@/src/features/solve/AnalyzingView';
import { SolutionScreen } from '@/src/features/solve/SolutionScreen';
import { callSolveQuestion } from '@/src/features/solve/solveClient';
import { uploadQuestionImage } from '@/src/features/solve/upload';
import { ensureSignedIn } from '@/src/lib/auth';
import type { SolveQuestionResponse } from '@/src/lib/api/types';
import { SAFETY_MESSAGES } from '@/src/lib/safetyMessages';
import { colors, space } from '@/src/theme';

export default function SolveFlowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string; mimeType?: string }>();
  const [phase, setPhase] = useState<'analyzing' | 'result' | 'error'>('analyzing');
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
        const user = await ensureSignedIn();
        const localId = `${Date.now()}`;
        const { imagePath } = await uploadQuestionImage({
          uid: user.uid,
          localId,
          uri: params.uri,
          mimeType: params.mimeType,
        });
        const response = await callSolveQuestion({
          imagePath,
          mimeType: params.mimeType,
        });
        if (cancelled) return;
        setResult(response);
        setPhase('result');
      } catch {
        if (cancelled) return;
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
    return <AnalyzingView />;
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
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  error: {
    color: colors.navy,
    textAlign: 'center',
    marginBottom: space.lg,
    fontSize: 16,
  },
  btn: {
    backgroundColor: colors.orange,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: 12,
  },
  btnText: { color: colors.white, fontWeight: '700' },
});
