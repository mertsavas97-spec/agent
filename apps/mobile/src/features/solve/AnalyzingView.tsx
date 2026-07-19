import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';

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
  'Net kadraj = daha iyi çözüm. Şıklar ve soru metni görünsün.',
  'Biraz sabır — adım adım Türkçe anlatım hazırlanıyor.',
  'Diyagram ağır sorularda metin yeterli olmayabilir; onu söyleriz.',
  'Anlamadığın adımı sonra “Anlamadım” ile yeniden sorabilirsin.',
];

/** Moodboard loading: robot + staged progress + rotating tips (keeps user engaged). */
export function AnalyzingView({ step = 'upload' }: AnalyzingViewProps) {
  const baseTarget = progressForStep(step);
  const anim = useRef(new Animated.Value(0.08)).current;
  const pulse = useRef(new Animated.Value(1)).current;
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

  // While on final "solve" stage, soft pulse toward 97% so bar never feels frozen at 90%
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
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    breathe.start();
    return () => breathe.stop();
  }, [pulse]);

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
      <Animated.View
        style={[styles.robot, { transform: [{ scale: pulse }] }]}
        accessibilityLabel="ÇözBil robot">
        <View style={styles.eyeRow}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.mouth} />
      </Animated.View>
      <Text style={styles.title} testID="analyzing-title">
        Sorun analiz ediliyor…
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
  robot: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  eyeRow: { flexDirection: 'row', gap: 18, marginBottom: 14 },
  eye: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.navy,
  },
  mouth: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: typography.headingWeight,
    textAlign: 'center',
  },
  stepLabel: {
    marginTop: space.sm,
    color: '#CBD5E1',
    fontSize: 15,
    fontFamily: typography.fontFamily,
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
    color: '#E2E8F0',
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
