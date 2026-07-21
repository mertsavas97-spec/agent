import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ADS_LIMITS, runInterstitialIfNeeded, runRewardedExtra } from '@/src/features/ads';
import { resolveActiveExamType } from '@/src/features/exam/resolveActiveExam';
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
import { ExamMismatchSheet } from '@/src/features/solve/ExamMismatchSheet';
import { SolutionScreen } from '@/src/features/solve/SolutionScreen';
import { SubjectConfirmSheet } from '@/src/features/solve/SubjectConfirmSheet';
import { callExplainAgain } from '@/src/features/solve/explainClient';
import { isOfflineSolutionId } from '@/src/features/solve/localSolveFallback';
import { uriToBase64 } from '@/src/features/solve/imageBase64';
import { normalizeSolvedBranch } from '@/src/features/solve/normalizeSolvedBranch';
import { enforceExamPipeline } from '@/src/features/solve/examPipelineIsolation';
import { callSolveQuestion } from '@/src/features/solve/solveClient';
import { solveFailureMessage } from '@/src/features/solve/solveFailureMessage';
import {
  applyExamOverride,
  applySubjectOverride,
  shouldConfirmExamMismatch,
  shouldConfirmSubject,
  type SolvedWithClassification,
} from '@/src/features/solve/subjectClassification';
import { uploadQuestionImage } from '@/src/features/solve/upload';
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
  | 'confirmExam'
  | 'confirmSubject'
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
  const [profileExam, setProfileExam] = useState<ExamType>('lgs');
  const [selectedSubject, setSelectedSubject] =
    useState<Exclude<Subject, 'unknown'>>('turkish');
  const [pendingSubjectHint, setPendingSubjectHint] = useState<
    Exclude<Subject, 'unknown'> | undefined
  >();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!params.uri) {
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
        setProfileExam(resolvedExam);
        const localId = `${Date.now()}`;
        const hintRaw = typeof params.subjectHint === 'string' ? params.subjectHint : '';
        const subjectHint: Exclude<Subject, 'unknown'> | undefined =
          isKnownSubject(hintRaw) && subjectsForExam(resolvedExam).includes(hintRaw)
            ? hintRaw
            : undefined;
        setPendingSubjectHint(subjectHint);

        const { imagePath, downloadUrl } = await uploadQuestionImage({
          uid: user.uid,
          localId,
          uri: params.uri,
          mimeType: params.mimeType,
          examType: resolvedExam,
          subjectHint,
        });
        if (cancelled) return;

        const imageBase64 = await uriToBase64(params.uri);
        if (cancelled) return;

        setAnalyzeStep('moderate');
        await new Promise((r) => setTimeout(r, 280));
        if (cancelled) return;
        setAnalyzeStep('solve');

        let response = await callSolveQuestion({
          imagePath,
          mimeType: params.mimeType,
          examType: resolvedExam,
          subjectHint,
          requestId: localId,
          imageUrl: downloadUrl,
          imageBase64: imageBase64 ?? undefined,
        });
        if (cancelled) return;

        if (response.status === 'solved' && subjectHint) {
          response = applySubjectOverride(response, resolvedExam, subjectHint);
        }

        if (response.status === 'solved') {
          // Always isolate against the *profile* exam until the user confirms a switch.
          // OCR examHint must never remount the result into another package's pipeline.
          const solved = enforceExamPipeline(
            normalizeSolvedBranch(response, resolvedExam, {
              sourceText:
                'ocrPreview' in response &&
                typeof (response as { ocrPreview?: string }).ocrPreview === 'string'
                  ? (response as { ocrPreview: string }).ocrPreview
                  : undefined,
            }),
            resolvedExam,
          ) as SolvedWithClassification;
          const suggested =
            solved.subject !== 'unknown' &&
            subjectsForExam(resolvedExam).includes(
              solved.subject as Exclude<Subject, 'unknown'>,
            )
              ? (solved.subject as Exclude<Subject, 'unknown'>)
              : subjectsForExam(resolvedExam)[0];
          setSelectedSubject(suggested);
          setResult(solved);

          if (shouldConfirmExamMismatch(solved.examHint, resolvedExam)) {
            setPhase('confirmExam');
            return;
          }
          if (shouldConfirmSubject(solved, { subjectHint, examType: resolvedExam })) {
            setPhase('confirmSubject');
            return;
          }
          setPhase('result');
          return;
        }

        setResult(response);
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
  }, [phase, result, examType, params.uri]);

  function continueAfterExam(nextExam: ExamType) {
    if (!result || result.status !== 'solved') return;
    let next = enforceExamPipeline(
      applyExamOverride(result, profileExam, nextExam),
      nextExam,
    );
    setExamType(nextExam);
    if (pendingSubjectHint && subjectsForExam(nextExam).includes(pendingSubjectHint)) {
      next = applySubjectOverride(next, nextExam, pendingSubjectHint);
    }
    const suggested =
      next.subject !== 'unknown' &&
      subjectsForExam(nextExam).includes(next.subject as Exclude<Subject, 'unknown'>)
        ? (next.subject as Exclude<Subject, 'unknown'>)
        : subjectsForExam(nextExam)[0];
    setSelectedSubject(suggested);
    setResult(next);
    if (shouldConfirmSubject(next, { subjectHint: pendingSubjectHint, examType: nextExam })) {
      setPhase('confirmSubject');
      return;
    }
    setPhase('result');
  }

  const suggestedSubject = useMemo(() => {
    if (result && result.status === 'solved' && result.subject !== 'unknown') {
      if (subjectsForExam(examType).includes(result.subject as Exclude<Subject, 'unknown'>)) {
        return result.subject as Exclude<Subject, 'unknown'>;
      }
    }
    const alt = result?.classification?.alternatives?.find((a) =>
      subjectsForExam(examType).includes(a.subject as Exclude<Subject, 'unknown'>),
    );
    if (alt?.subject) {
      return alt.subject as Exclude<Subject, 'unknown'>;
    }
    // Never pretend the first catalog subject (KPSS→Türkçe) is a real OCR guess
    return subjectsForExam(examType)[0];
  }, [result, examType]);

  if (phase === 'analyzing') {
    return (
      <>
        <Stack.Screen options={{ title: 'Çözüm', headerBackTitle: 'Geri' }} />
        <AnalyzingView step={analyzeStep} />
      </>
    );
  }

  if (phase === 'confirmExam' && result && result.status === 'solved' && result.examHint) {
    return (
      <>
        <Stack.Screen options={{ title: 'Çözüm', headerBackTitle: 'Geri' }} />
        <AnalyzingView step="solve" />
        <ExamMismatchSheet
          visible
          profileExam={profileExam}
          hint={result.examHint}
          onKeepProfile={() => continueAfterExam(profileExam)}
          onSwitchSuggested={() => {
            const suggested = result.examHint?.suggested;
            if (suggested) continueAfterExam(suggested);
          }}
        />
      </>
    );
  }

  if (phase === 'confirmSubject' && result && result.status === 'solved') {
    return (
      <>
        <Stack.Screen options={{ title: 'Çözüm', headerBackTitle: 'Geri' }} />
        <AnalyzingView step="solve" />
        <SubjectConfirmSheet
          visible
          examType={examType}
          suggested={suggestedSubject}
          selected={selectedSubject}
          confidence={result.classification?.confidence}
          hasGuess={result.subject !== 'unknown'}
          onSelect={setSelectedSubject}
          onDismiss={() => router.back()}
          onConfirm={() => {
            const next = applySubjectOverride(result, examType, selectedSubject);
            setResult(next);
            setPhase('result');
          }}
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
