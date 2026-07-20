import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, space } from '@/src/theme';

import { EXAM_OPTIONS, LEGAL_COPY, ONBOARDING_STEPS } from './copy';

export type OnboardingResult = {
  examType: ExamType;
  ageBand: 'under13' | '13to17' | '18plus';
  parentalConsent: boolean;
};

export type OnboardingFlowProps = {
  onComplete: (result: OnboardingResult) => void;
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [consented, setConsented] = useState(false);

  const isExamStep = step === 2;
  const legal = useMemo(() => {
    if (examType === 'lgs') return LEGAL_COPY.minorParental;
    return LEGAL_COPY.adultStandard;
  }, [examType]);

  function finish() {
    if (!examType || !consented) return;
    const isMinorPath = examType === 'lgs';
    onComplete({
      examType,
      ageBand: isMinorPath ? '13to17' : '18plus',
      parentalConsent: isMinorPath,
    });
  }

  return (
    <View style={styles.container} testID={`onboarding-step-${step}`}>
      <Text style={styles.brand}>ÇözBil</Text>
      <Text style={styles.title}>{ONBOARDING_STEPS[step].title}</Text>
      <Text style={styles.body}>{ONBOARDING_STEPS[step].body}</Text>

      {isExamStep ? (
        <View style={styles.examList}>
          {EXAM_OPTIONS.map((opt) => {
            const selected = examType === opt.id;
            return (
              <Pressable
                key={opt.id}
                testID={`exam-${opt.id}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: false, selected }}
                style={[styles.examBtn, selected && styles.examSelected]}
                onPress={() => {
                  setExamType(opt.id);
                  setConsented(false);
                }}>
                <Text style={[styles.examLabel, selected && styles.examLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.examHint}>{opt.hint}</Text>
              </Pressable>
            );
          })}

          {examType ? (
            <Pressable
              testID="consent-toggle"
              style={styles.consentRow}
              onPress={() => setConsented((v) => !v)}>
              <View style={[styles.checkbox, consented && styles.checkboxOn]} />
              <Text style={styles.consentText}>{legal}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!isExamStep ? (
        <Pressable
          testID="onboarding-next"
          style={styles.cta}
          onPress={() => setStep((s) => Math.min(2, s + 1))}>
          <Text style={styles.ctaLabel}>Devam</Text>
        </Pressable>
      ) : (
        <Pressable
          testID="onboarding-finish"
          style={[styles.cta, (!examType || !consented) && styles.ctaDisabled]}
          disabled={!examType || !consented}
          onPress={finish}>
          <Text style={styles.ctaLabel}>Ana Sayfaya git</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: space.lg,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: space.xl,
  },
  examList: { gap: space.sm, marginBottom: space.lg },
  examBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: space.md,
    backgroundColor: colors.white,
  },
  examSelected: {
    borderColor: colors.orange,
    backgroundColor: '#FFFBEB',
  },
  examLabel: { fontSize: 18, fontWeight: '700', color: colors.navy },
  examLabelSelected: { color: colors.orange },
  examHint: { color: colors.textSecondary, marginTop: 2 },
  consentRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.navy,
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  consentText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  cta: {
    backgroundColor: colors.orange,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
