import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, motion, radii, space, typography } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';

import {
  ANALYZE_STEPS,
  type AnalyzeStepId,
  labelForStep,
  progressForStep,
} from './analyzeSteps';
import {
  liveCopyFor,
  type LiveSolveCopy,
  type LiveSolvePhase,
  progressForLivePhase,
} from './liveSolveCopy';
import { SOLVE_PROGRESS_CRAWL_MS, SOLVE_PROGRESS_CRAWL_TARGET } from './solveTiming';

export { SOLVE_PROGRESS_CRAWL_MS, SOLVE_PROGRESS_CRAWL_TARGET } from './solveTiming';

export type AnalyzingViewProps = {
  step?: AnalyzeStepId;
  /** Pipeline-aware live copy — overrides rotating tips when set. */
  live?: LiveSolveCopy | null;
  /** Optional status under the tip — e.g. multi-batch "Soru 2/5 hazır" */
  statusLine?: string | null;
};

const ICON_SIZE = 72;
const ICON_RADIUS = Math.round(ICON_SIZE * 0.22);

/**
 * Moodboard loading: solid navy, official app icon, quiet premium frame.
 * Progress bar is the only motion — no background washes or robot pulse.
 */
export function AnalyzingView({
  step = 'upload',
  live = null,
  statusLine,
}: AnalyzingViewProps) {
  const effectiveStep = live?.step ?? step;
  const baseTarget = live
    ? progressForLivePhase(live.phase)
    : progressForStep(effectiveStep);
  const copy = useMemo(
    () => live ?? liveCopyFor(stepToPhase(effectiveStep)),
    [live, effectiveStep],
  );

  const anim = useRef(new Animated.Value(0.08)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const [displayPct, setDisplayPct] = useState(8);
  const peakRef = useRef(0.08);
  const prevTip = useRef(copy.tip);

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      const next = Math.max(peakRef.current, value);
      peakRef.current = next;
      setDisplayPct(Math.min(99, Math.round(next * 100)));
    });
    return () => {
      anim.removeListener(id);
    };
  }, [anim]);

  useEffect(() => {
    const target = Math.max(peakRef.current, baseTarget);
    Animated.timing(anim, {
      toValue: target,
      duration: motion.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, baseTarget]);

  useEffect(() => {
    if (effectiveStep !== 'solve' && copy.phase !== 'solving' && copy.phase !== 'finishing') {
      return;
    }
    const crawl = Animated.timing(anim, {
      toValue: SOLVE_PROGRESS_CRAWL_TARGET,
      duration: SOLVE_PROGRESS_CRAWL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    crawl.start();
    return () => crawl.stop();
  }, [anim, effectiveStep, copy.phase]);

  useEffect(() => {
    if (copy.tip === prevTip.current) return;
    prevTip.current = copy.tip;
    tipOpacity.setValue(0);
    Animated.timing(tipOpacity, {
      toValue: 1,
      duration: motion.normal,
      useNativeDriver: true,
    }).start();
  }, [copy.tip, tipOpacity]);

  const widthInterp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container} testID="analyzing-view">
      <View style={styles.hero} testID="analyzing-hero">
        <View style={styles.ringOuter} testID="analyzing-icon-plate">
          <View style={styles.ringGap}>
            <View style={styles.ringAccent}>
              <CozbilRobot
                animate={false}
                size={ICON_SIZE}
                testID="cozbil-robot"
                style={styles.icon}
              />
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.title} testID="analyzing-title">
        {copy.headline}
      </Text>
      <Text style={styles.wait} testID="analyzing-wait">
        {copy.detail}
      </Text>
      <Text style={styles.stepLabel} testID="analyzing-step-label">
        {labelForStep(effectiveStep)}
      </Text>

      <View style={styles.barTrack} testID="analyzing-progress-bar">
        <Animated.View style={[styles.barFill, { width: widthInterp }]} />
      </View>
      <Text style={styles.pct} testID="analyzing-progress-pct">
        %{displayPct}
      </Text>

      <Animated.Text style={[styles.tip, { opacity: tipOpacity }]} testID="analyzing-tip">
        {copy.tip}
      </Animated.Text>

      {statusLine ? (
        <Text style={styles.statusLine} testID="analyzing-status-line">
          {statusLine}
        </Text>
      ) : null}

      <View style={styles.steps} testID="analyzing-steps">
        {ANALYZE_STEPS.map((s, index) => {
          const active = s.id === effectiveStep;
          const completed = progressForStep(s.id) < baseTarget && !active;
          return (
            <View
              key={s.id}
              style={[
                styles.stepRow,
                active && styles.stepRowActive,
                completed && styles.stepRowDone,
              ]}>
              <View
                style={[
                  styles.stepDot,
                  active && styles.stepDotActive,
                  completed && styles.stepDotDone,
                ]}>
                <Text style={styles.stepDotText}>
                  {completed ? '✓' : active ? String(index + 1) : '·'}
                </Text>
              </View>
              <Text
                testID={`analyzing-step-${s.id}`}
                style={[
                  styles.stepItem,
                  active && styles.stepActive,
                  completed && styles.stepDone,
                ]}>
                {completed && s.id === 'upload'
                  ? 'Fotoğraf yüklendi'
                  : completed && s.id === 'moderate'
                    ? 'Güvenlik tamam'
                    : s.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function stepToPhase(step: AnalyzeStepId): LiveSolvePhase {
  if (step === 'moderate') return 'moderate';
  if (step === 'solve') return 'solving';
  return 'upload';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  /** Outer hairline — soft white for depth on navy */
  ringOuter: {
    padding: 1.5,
    borderRadius: ICON_RADIUS + 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  /** Quiet gap between hairline and accent */
  ringGap: {
    padding: 3,
    borderRadius: ICON_RADIUS + 8,
    backgroundColor: colors.navy,
  },
  /** Brand accent stroke */
  ringAccent: {
    padding: 2,
    borderRadius: ICON_RADIUS + 4,
    backgroundColor: colors.orange,
  },
  icon: {
    borderRadius: ICON_RADIUS,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: space.sm,
    letterSpacing: -0.3,
  },
  wait: {
    marginTop: space.sm,
    color: 'rgba(241, 245, 249, 0.92)',
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
    textAlign: 'center',
    paddingHorizontal: space.md,
  },
  barTrack: {
    marginTop: space.lg,
    width: '80%',
    maxWidth: 280,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
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
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    fontSize: 14,
  },
  tip: {
    marginTop: space.lg,
    color: 'rgba(226, 232, 240, 0.88)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: space.md,
    fontFamily: typography.fontFamily,
    minHeight: 44,
  },
  statusLine: {
    marginTop: space.sm,
    color: colors.orange,
    fontSize: 14,
    fontFamily: typography.fontFamilySemiBold,
    textAlign: 'center',
  },
  steps: {
    marginTop: space.xl,
    alignSelf: 'stretch',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepRowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  stepRowDone: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  stepDotActive: {
    backgroundColor: colors.orange,
  },
  stepDotDone: {
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
  },
  stepDotText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
  },
  stepItem: {
    color: 'rgba(203, 213, 225, 0.95)',
    fontSize: 14,
    fontFamily: typography.fontFamily,
    flex: 1,
  },
  stepActive: {
    color: colors.white,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
  },
  stepDone: {
    color: 'rgba(226, 232, 240, 0.95)',
  },
});
