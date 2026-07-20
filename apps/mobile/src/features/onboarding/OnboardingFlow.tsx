import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { examThemeFor } from '@/src/features/exam/examTheme';
import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';
import { Eyebrow } from '@/src/ui/Eyebrow';

import { EXAM_OPTIONS, LEGAL_COPY, ONBOARDING_STEPS } from './copy';

export type OnboardingResult = {
  examType: ExamType;
  ageBand: 'under13' | '13to17' | '18plus';
  parentalConsent: boolean;
};

export type OnboardingFlowProps = {
  onComplete: (result: OnboardingResult) => void;
};

function StepProgress({ step, accent }: { step: number; accent: string }) {
  return (
    <View style={styles.progressRow} testID="onboarding-progress">
      {ONBOARDING_STEPS.map((_, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <View key={i} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                done || active ? { backgroundColor: accent } : styles.progressDotIdle,
                active ? { transform: [{ scale: 1.08 }] } : null,
              ]}
            />
            <Text
              style={[
                styles.progressLabel,
                active ? { color: accent, fontWeight: '700' } : null,
              ]}
              numberOfLines={1}>
              {ONBOARDING_STEPS[i].eyebrow}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

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

  const accent = isExamStep && theme ? theme.accent : colors.orange;
  const solid = isExamStep && theme ? theme.solid : colors.navy;
  const soft = isExamStep && theme ? theme.soft : colors.surface;
  const stepMeta = ONBOARDING_STEPS[step];

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
    <SafeAreaView
      style={[styles.safe, { backgroundColor: soft }]}
      edges={['top', 'left', 'right']}>
      <View style={styles.flex} testID={`onboarding-step-${step}`}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <CozbilRobot size={40} animate tone="onLight" testID="onboarding-robot" />
            <Text style={[styles.brand, { color: solid }]}>ÇözBil</Text>
          </View>
          <Text style={[styles.stepCounter, { color: accent }]}>
            {step + 1} / {ONBOARDING_STEPS.length}
          </Text>
        </View>

        <StepProgress step={step} accent={accent} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.heroCard,
              {
                borderColor: isExamStep && theme ? theme.accent : colors.border,
                backgroundColor: colors.white,
              },
            ]}
            testID="onboarding-hero">
            <View
              style={[
                styles.heroIconWrap,
                { backgroundColor: isExamStep && theme ? theme.soft : colors.navySoft },
              ]}>
              <SymbolView
                name={stepMeta.icon}
                size={28}
                tintColor={solid}
                type="hierarchical"
              />
            </View>
            <Eyebrow color={accent} style={styles.heroEyebrow}>
              {stepMeta.eyebrow}
            </Eyebrow>
            <Text style={[styles.title, { color: solid }]}>{stepMeta.title}</Text>
            <Text style={styles.body}>{stepMeta.body}</Text>
          </View>

          {isExamStep ? (
            <View style={styles.examList}>
              <Text style={[styles.examListTitle, { color: solid }]}>
                Modunu seç — renk teması anında uygulanır
              </Text>
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
                      selected ? shadows.soft : null,
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
                      <View style={styles.examLabelRow}>
                        <Text
                          style={[
                            styles.examLabel,
                            selected ? { color: optTheme.solid } : null,
                          ]}>
                          {opt.label}
                        </Text>
                        {selected ? (
                          <View
                            style={[
                              styles.examModeChip,
                              { backgroundColor: optTheme.solid },
                            ]}>
                            <Text style={styles.examModeChipText}>{optTheme.modeChip}</Text>
                          </View>
                        ) : null}
                      </View>
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
                  style={[
                    styles.consentCard,
                    { borderColor: theme.accent, backgroundColor: colors.white },
                  ]}
                  onPress={() => setConsented((v) => !v)}>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: solid },
                      consented ? { backgroundColor: accent, borderColor: accent } : null,
                    ]}>
                    {consented ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.consentText}>{legal}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.featureList}>
              {step === 0 ? (
                <>
                  <FeatureRow accent={accent} label="Kamera veya galeri" />
                  <FeatureRow accent={accent} label="Tek veya çoklu soru" />
                  <FeatureRow accent={accent} label="Günlük çözüm kotası" />
                </>
              ) : (
                <>
                  <FeatureRow accent={accent} label="Adım adım çözüm" />
                  <FeatureRow accent={accent} label="Konu anlatımına geçiş" />
                  <FeatureRow accent={accent} label="Geçmiş ve istatistik" />
                </>
              )}
            </View>
          )}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {!isExamStep ? (
            <Pressable
              testID="onboarding-next"
              style={[styles.cta, { backgroundColor: accent }]}
              onPress={() => setStep((s) => Math.min(2, s + 1))}>
              <Text style={[styles.ctaLabel, { color: colors.navy }]}>Devam</Text>
            </Pressable>
          ) : (
            <Pressable
              testID="onboarding-finish"
              style={[
                styles.cta,
                theme ? { backgroundColor: accent } : styles.ctaDisabledBg,
                (!examType || !consented) && styles.ctaDisabled,
              ]}
              disabled={!examType || !consented}
              onPress={finish}>
              <Text style={[styles.ctaLabel, theme ? { color: solid } : null]}>
                Ana sayfaya git
              </Text>
            </Pressable>
          )}
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({ label, accent }: { label: string; accent: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureBullet, { backgroundColor: accent }]} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    marginBottom: space.sm,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  brand: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  stepCounter: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 13,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: space.lg,
    marginBottom: space.md,
    gap: space.sm,
  },
  progressItem: { flex: 1, alignItems: 'center', gap: 6 },
  progressDot: {
    height: 4,
    width: '100%',
    borderRadius: radii.pill,
  },
  progressDotIdle: { backgroundColor: colors.border },
  progressLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  heroCard: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: space.lg,
    marginBottom: space.lg,
    ...shadows.soft,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  heroEyebrow: { marginBottom: 6 },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 26,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.4,
    marginBottom: space.sm,
  },
  body: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  featureList: {
    gap: space.sm,
    marginBottom: space.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featureText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 14,
    color: colors.navy,
    fontWeight: '600',
  },
  examList: { gap: space.sm, marginBottom: space.sm },
  examListTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: space.xs,
    opacity: 0.85,
  },
  examBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radii.lg,
    padding: space.md,
  },
  examSwatch: {
    width: 12,
    height: 48,
    borderRadius: 6,
  },
  examTextCol: { flex: 1 },
  examLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  examLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  examModeChip: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  examModeChipText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  examHint: {
    fontFamily: typography.fontFamily,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  examSelectedMark: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 20,
    fontWeight: '700',
  },
  consentCard: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
    padding: space.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    ...shadows.soft,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkMark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  consentText: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  cta: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.cta,
  },
  ctaDisabledBg: { backgroundColor: colors.border },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontWeight: '700',
    fontSize: 16,
  },
});
