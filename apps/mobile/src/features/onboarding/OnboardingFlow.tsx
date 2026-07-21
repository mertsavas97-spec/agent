import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { examThemeFor } from '@/src/features/exam/examTheme';
import type { ExamType } from '@/src/lib/api/types';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { hapticLight, hapticSelection, hapticSuccess } from '@/src/ui/haptics';

import { EXAM_OPTIONS, LEGAL_COPY, ONBOARDING_STEPS, AGE_BAND_OPTIONS } from './copy';

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
  const [ageBand, setAgeBand] = useState<OnboardingResult['ageBand'] | null>(null);
  const [consented, setConsented] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const ageY = useRef(0);
  const consentY = useRef(0);

  const isExamStep = step === 2;
  const theme = examThemeFor(examType);
  const isMinorPath = ageBand === 'under13' || ageBand === '13to17';
  const legal = useMemo(() => {
    if (ageBand === 'under13') return LEGAL_COPY.under13;
    if (ageBand === '13to17') return LEGAL_COPY.minor13to17;
    return LEGAL_COPY.adultStandard;
  }, [ageBand]);

  const accent = isExamStep && theme ? theme.accent : colors.orange;
  const solid = isExamStep && theme ? theme.solid : colors.navy;
  const soft = isExamStep && theme ? theme.soft : colors.surface;
  const stepMeta = ONBOARDING_STEPS[step];
  const canFinish = Boolean(examType && ageBand && consented);

  useEffect(() => {
    if (!isExamStep || !examType) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, ageY.current - 12), animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [examType, isExamStep]);

  useEffect(() => {
    if (!isExamStep || !ageBand) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, consentY.current - 12), animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [ageBand, isExamStep]);

  function finish() {
    if (!examType || !ageBand || !consented) return;
    void hapticSuccess();
    onComplete({
      examType,
      ageBand,
      parentalConsent: isMinorPath,
    });
  }

  function onAgeLayout(e: LayoutChangeEvent) {
    ageY.current = e.nativeEvent.layout.y;
  }

  function onConsentLayout(e: LayoutChangeEvent) {
    consentY.current = e.nativeEvent.layout.y;
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
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            isExamStep ? styles.scrollContentExam : null,
          ]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.heroCard,
              isExamStep && styles.heroCardCompact,
              {
                borderColor: isExamStep && theme ? theme.accent : colors.border,
                backgroundColor: colors.white,
              },
            ]}
            testID="onboarding-hero">
            <View
              style={[
                styles.heroIconWrap,
                isExamStep && styles.heroIconHidden,
                { backgroundColor: isExamStep && theme ? theme.soft : colors.navySoft },
              ]}>
              {!isExamStep ? (
                <SymbolView
                  name={stepMeta.icon}
                  size={28}
                  tintColor={solid}
                  type="hierarchical"
                />
              ) : null}
            </View>
            <Eyebrow color={accent} style={styles.heroEyebrow}>
              {stepMeta.eyebrow}
            </Eyebrow>
            <Text
              style={[
                styles.title,
                isExamStep && styles.titleCompact,
                { color: solid },
              ]}>
              {stepMeta.title}
            </Text>
            {!isExamStep ? <Text style={styles.body}>{stepMeta.body}</Text> : null}
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
                      void hapticSelection();
                      setExamType(opt.id);
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
                <View
                  style={styles.ageBlock}
                  testID="age-band-section"
                  onLayout={onAgeLayout}>
                  <Text style={[styles.examListTitle, { color: solid }]}>
                    Yaş bandın
                  </Text>
                  {AGE_BAND_OPTIONS.map((opt) => {
                    const selected = ageBand === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        testID={`age-${opt.id}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[
                          styles.ageBtn,
                          {
                            borderColor: selected ? theme.accent : colors.border,
                            backgroundColor: selected ? theme.soft : colors.white,
                          },
                        ]}
                        onPress={() => {
                          void hapticSelection();
                          setAgeBand(opt.id);
                          setConsented(false);
                        }}>
                        <Text
                          style={[
                            styles.ageLabel,
                            selected ? { color: theme.solid } : null,
                          ]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.ageHint}>{opt.hint}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {examType && ageBand && theme ? (
                <Pressable
                  testID="consent-toggle"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: consented }}
                  accessibilityLabel={
                    ageBand === 'under13'
                      ? 'Veli onayı'
                      : ageBand === '13to17'
                        ? 'Veli bilgilendirmesi onayı'
                        : 'KVKK onayı'
                  }
                  style={[
                    styles.consentCard,
                    { borderColor: theme.accent, backgroundColor: colors.white },
                  ]}
                  onLayout={onConsentLayout}
                  onPress={() => {
                    void hapticLight();
                    setConsented((v) => !v);
                  }}>
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
              onPress={() => {
                void hapticLight();
                setStep((s) => Math.min(2, s + 1));
              }}>
              <Text style={styles.ctaLabelReady}>Devam</Text>
            </Pressable>
          ) : (
            <Pressable
              testID="onboarding-finish"
              accessibilityState={{ disabled: !canFinish }}
              style={[
                styles.cta,
                canFinish
                  ? { backgroundColor: accent, opacity: 1 }
                  : styles.ctaIdle,
              ]}
              disabled={!canFinish}
              onPress={finish}>
              <Text
                style={canFinish ? styles.ctaLabelReady : styles.ctaLabelIdle}
                testID="onboarding-finish-label">
                Ana sayfaya git
              </Text>
            </Pressable>
          )}
          {isExamStep && !canFinish ? (
            <Text style={styles.ctaHint} testID="onboarding-finish-hint">
              {!examType
                ? 'Önce sınav modunu seç'
                : !ageBand
                  ? 'Yaş bandını seç, sonra onayı işaretle'
                  : 'Devam için onay kutusunu işaretle'}
            </Text>
          ) : null}
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
  scrollContentExam: {
    paddingBottom: space.xl * 2,
  },
  heroCard: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    padding: space.lg,
    marginBottom: space.lg,
    ...shadows.soft,
  },
  heroCardCompact: {
    padding: space.md,
    marginBottom: space.sm,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  heroIconHidden: {
    width: 0,
    height: 0,
    marginBottom: 0,
    overflow: 'hidden',
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
  titleCompact: {
    fontSize: 20,
    marginBottom: 0,
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
    paddingVertical: 12,
    paddingHorizontal: space.md,
  },
  examSwatch: {
    width: 12,
    height: 40,
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
    fontSize: 17,
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
    fontSize: 12,
  },
  examSelectedMark: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 20,
    fontWeight: '700',
  },
  ageBlock: { gap: space.sm, marginTop: space.md },
  ageBtn: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: space.md,
  },
  ageLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  ageHint: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  consentCard: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
    marginBottom: space.lg,
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
    backgroundColor: colors.white,
  },
  cta: {
    backgroundColor: colors.orange,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.cta,
  },
  ctaIdle: {
    backgroundColor: colors.border,
    opacity: 1,
  },
  ctaLabelReady: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.navy,
    fontWeight: '700',
    fontSize: 16,
    opacity: 1,
  },
  ctaLabelIdle: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 16,
  },
  ctaHint: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
