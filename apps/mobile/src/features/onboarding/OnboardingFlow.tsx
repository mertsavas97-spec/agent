import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { examThemeFor } from '@/src/features/exam/examTheme';
import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, space, typography } from '@/src/theme';

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
  const theme = examThemeFor(examType);
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

  const accent = theme?.accent ?? colors.orange;
  const solid = theme?.solid ?? colors.navy;
  const soft = theme?.soft ?? colors.surface;

  return (
    <View
      style={[styles.container, isExamStep && theme ? { backgroundColor: soft } : null]}
      testID={`onboarding-step-${step}`}>
      <Text style={[styles.brand, isExamStep && theme ? { color: solid } : null]}>
        ÇözBil
      </Text>
      <Text style={[styles.progress, { color: accent }]}>
        Adım {step + 1} / {ONBOARDING_STEPS.length}
      </Text>
      <Text style={[styles.title, isExamStep && theme ? { color: solid } : null]}>
        {ONBOARDING_STEPS[step].title}
      </Text>
      <Text style={styles.body}>{ONBOARDING_STEPS[step].body}</Text>

      {isExamStep ? (
        <View style={styles.examList}>
          {EXAM_OPTIONS.map((opt) => {
            const selected = examType === opt.id;
            const optTheme = examThemeFor(opt.id)!;
            return (
              <Pressable
                key={opt.id}
                testID={`exam-${opt.id}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: false, selected }}
                style={[
                  styles.examBtn,
                  {
                    backgroundColor: optTheme.soft,
                    borderColor: selected ? optTheme.accent : optTheme.solid,
                    borderWidth: selected ? 2.5 : 1.5,
                  },
                ]}
                onPress={() => {
                  setExamType(opt.id);
                  setConsented(false);
                }}>
                <View
                  style={[
                    styles.examSwatch,
                    { backgroundColor: selected ? optTheme.solid : optTheme.accent },
                  ]}
                />
                <View style={styles.examTextCol}>
                  <Text
                    style={[
                      styles.examLabel,
                      selected ? { color: optTheme.solid } : null,
                    ]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.examHint}>{opt.hint}</Text>
                </View>
                {selected ? (
                  <Text style={[styles.examSelectedMark, { color: optTheme.solid }]}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            );
          })}

          {examType && theme ? (
            <Pressable
              testID="consent-toggle"
              style={styles.consentRow}
              onPress={() => setConsented((v) => !v)}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: solid },
                  consented ? { backgroundColor: accent, borderColor: accent } : null,
                ]}
              />
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
          style={[
            styles.cta,
            theme ? { backgroundColor: accent } : null,
            (!examType || !consented) && styles.ctaDisabled,
          ]}
          disabled={!examType || !consented}
          onPress={finish}>
          <Text style={[styles.ctaLabel, theme ? { color: solid } : null]}>
            Ana sayfaya git
          </Text>
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
    fontFamily: typography.fontFamilyBold,
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
    letterSpacing: -0.4,
  },
  progress: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.orange,
    marginBottom: space.sm,
    fontWeight: '600',
  },
  title: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
  },
  body: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: space.xl,
  },
  examList: { gap: space.sm, marginBottom: space.lg },
  examBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: space.md,
    backgroundColor: colors.white,
  },
  examSwatch: {
    width: 12,
    height: 44,
    borderRadius: 6,
  },
  examTextCol: { flex: 1 },
  examLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  examHint: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  examSelectedMark: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 18,
    fontWeight: '700',
  },
  consentRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.navy,
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cta: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontWeight: '700',
    fontSize: 16,
  },
});
