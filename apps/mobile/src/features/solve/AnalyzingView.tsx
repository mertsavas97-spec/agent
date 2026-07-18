import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';

import {
  ANALYZE_STEPS,
  type AnalyzeStepId,
  labelForStep,
  progressForStep,
} from './analyzeSteps';

export type AnalyzingViewProps = {
  /** Current pipeline stage — camera and gallery use the same steps. */
  step?: AnalyzeStepId;
};

/** Moodboard loading: robot + staged progress (upload → filter → solve). */
export function AnalyzingView({ step = 'upload' }: AnalyzingViewProps) {
  const target = progressForStep(step);
  const anim = useRef(new Animated.Value(0.08)).current;
  const [displayPct, setDisplayPct] = useState(8);

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      setDisplayPct(Math.round(value * 100));
    });
    Animated.timing(anim, {
      toValue: target,
      duration: 450,
      useNativeDriver: false,
    }).start();
    return () => {
      anim.removeListener(id);
    };
  }, [anim, target]);

  const widthInterp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} testID="analyzing-view">
      <View style={styles.robot} accessibilityLabel="ÇözBil robot">
        <View style={styles.eyeRow}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.mouth} />
      </View>
      <Text style={styles.title} testID="analyzing-title">
        Sorun analiz ediliyor...
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

      <View style={styles.steps} testID="analyzing-steps">
        {ANALYZE_STEPS.map((s) => {
          const active = s.id === step;
          const done = progressForStep(s.id) < target || s.id === step;
          return (
            <Text
              key={s.id}
              testID={`analyzing-step-${s.id}`}
              style={[styles.stepItem, active && styles.stepActive, done && styles.stepDone]}>
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
    width: 96,
    height: 96,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  eyeRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  eye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.navy,
  },
  mouth: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.orange,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontFamily: typography.fontFamily,
    fontWeight: typography.headingWeight,
  },
  stepLabel: {
    marginTop: space.sm,
    color: '#CBD5E1',
    fontSize: 14,
  },
  barTrack: {
    marginTop: space.lg,
    width: '80%',
    maxWidth: 280,
    height: 8,
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
    fontWeight: typography.captionWeight,
    fontSize: 13,
  },
  steps: {
    marginTop: space.xl,
    alignSelf: 'stretch',
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  stepItem: {
    color: '#64748B',
    fontSize: 13,
  },
  stepActive: {
    color: colors.white,
    fontWeight: typography.captionWeight,
  },
  stepDone: {
    color: '#94A3B8',
  },
});
