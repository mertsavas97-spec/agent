import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';

import {
  ANALYZE_STEPS,
  type AnalyzeStepId,
  labelForStep,
  progressForStep,
} from './analyzeSteps';

export type AnalyzingViewProps = {
  step?: AnalyzeStepId;
};

const TIPS = [
  'Birkaç saniye — öğretmen gibi adım adım hazırlıyorum.',
  'Net kadraj = daha net çözüm. Soru + şıklar framesinde olsun.',
  'Diyagramlı sorularda metin yetmezse dürüstçe söylerim.',
  'Sonra “Anlamadım” dersen daha sade anlatırım.',
];

/** Moodboard loading: neşeli robot + staged progress + rotating tips. */
export function AnalyzingView({ step = 'upload' }: AnalyzingViewProps) {
  const baseTarget = progressForStep(step);
  const anim = useRef(new Animated.Value(0.08)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const [displayPct, setDisplayPct] = useState(8);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      setDisplayPct(Math.min(99, Math.round(value * 100)));
    });
    Animated.timing(anim, {
      toValue: baseTarget,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => {
      anim.removeListener(id);
    };
  }, [anim, baseTarget]);

  useEffect(() => {
    if (step !== 'solve') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.97,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0.88,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, step]);

  useEffect(() => {
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(tipOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4200);
    return () => clearInterval(id);
  }, [tipOpacity]);

  const widthInterp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} testID="analyzing-view">
      <CozbilRobot size={112} />
      <Text style={styles.title} testID="analyzing-title">
        Sorun analiz ediliyor…
      </Text>
      <Text style={styles.wait} testID="analyzing-wait">
        Lütfen birkaç saniye bekle — birlikte çözüyoruz.
      </Text>
      <Text style={styles.stepLabel} testID="analyzing-step-label">
        {labelForStep(step)}
      </Text>

      <View style={styles.barTrack} testID="analyzing-progress-bar">
        <Animated.View style={[styles.barFill, { width: widthInterp }]} />
      </View>
      <Text style={styles.pct} testID="analyzing-progress-pct">
        %{displayPct}
      </Text>

      <Animated.Text style={[styles.tip, { opacity: tipOpacity }]} testID="analyzing-tip">
        {TIPS[tipIndex]}
      </Animated.Text>

      <View style={styles.steps} testID="analyzing-steps">
        {ANALYZE_STEPS.map((s) => {
          const active = s.id === step;
          const done = progressForStep(s.id) < baseTarget || s.id === step;
          return (
            <Text
              key={s.id}
              testID={`analyzing-step-${s.id}`}
              style={[styles.stepItem, active && styles.stepActive, done && styles.stepDone]}>
              {done && !active ? '✓ ' : active ? '● ' : '○ '}
              {s.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: typography.headingWeight,
    textAlign: 'center',
    marginTop: space.sm,
  },
  wait: {
    marginTop: 8,
    color: '#E2E8F0',
    fontSize: 15,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: space.md,
  },
  stepLabel: {
    marginTop: space.md,
    color: colors.orange,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: typography.captionWeight,
  },
  barTrack: {
    marginTop: space.lg,
    width: '80%',
    maxWidth: 280,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: '#2A2660',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
  },
  pct: {
    marginTop: space.sm,
    color: colors.orange,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: typography.captionWeight,
    fontSize: 14,
  },
  tip: {
    marginTop: space.lg,
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: space.md,
    fontFamily: typography.fontFamily,
    minHeight: 44,
  },
  steps: {
    marginTop: space.xl,
    alignSelf: 'stretch',
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  stepItem: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: typography.fontFamily,
  },
  stepActive: {
    color: colors.white,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: typography.captionWeight,
  },
  stepDone: {
    color: '#94A3B8',
  },
});
