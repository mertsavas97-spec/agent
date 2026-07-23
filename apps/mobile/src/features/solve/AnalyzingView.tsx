import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

import { colors, motion, radii, space, typography } from '@/src/theme';
import { BRAND_MARK, CozbilRobot } from '@/src/ui/CozbilRobot';

import {
  ANALYZE_STEPS,
  type AnalyzeStepId,
  progressForStep,
} from './analyzeSteps';
import {
  checklistLabelFor,
  liveCopyFor,
  type LiveSolveCopy,
  type LiveSolvePhase,
  phaseRank,
  progressForLivePhase,
  shouldCrawlProgress,
  statusLabelForPhase,
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
const RING_PAD = 14;
const RING_SIZE = ICON_SIZE + RING_PAD * 2;
const RING_RADIUS = Math.round(RING_SIZE * 0.28);

// Decode brand mark as soon as this module loads (home already warms it too).
const brandUri = Image.resolveAssetSource(BRAND_MARK)?.uri;
if (brandUri) {
  void Image.prefetch(brandUri);
}

/**
 * Moodboard loading: solid navy, official app icon, animated premium rings.
 * Progress tracks live pipeline phases and soft-crawls during OCR/solve waits.
 */
export function AnalyzingView({
  step = 'upload',
  live = null,
  statusLine,
}: AnalyzingViewProps) {
  const effectiveStep = live?.step ?? step;
  const copy = useMemo(
    () => live ?? liveCopyFor(stepToPhase(effectiveStep)),
    [live, effectiveStep],
  );
  const baseTarget = live
    ? progressForLivePhase(live.phase)
    : progressForStep(effectiveStep);

  const anim = useRef(new Animated.Value(0.08)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;
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
    if (!shouldCrawlProgress(copy.phase)) return;
    // Resume crawl from the current peak so OCR/solve waits keep the bar moving.
    const from = Math.max(peakRef.current, baseTarget);
    anim.setValue(from);
    const crawl = Animated.timing(anim, {
      toValue: SOLVE_PROGRESS_CRAWL_TARGET,
      duration: SOLVE_PROGRESS_CRAWL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    crawl.start();
    return () => crawl.stop();
  }, [anim, baseTarget, copy.phase]);

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: motion.orbit,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ringPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    spin.start();
    pulse.start();
    return () => {
      spin.stop();
      pulse.stop();
    };
  }, [ringPulse, ringSpin]);

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
  const spinRotate = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const pulseScale = ringPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const pulseOpacity = ringPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.95],
  });

  const activeRank = phaseRank(copy.phase);

  return (
    <View style={styles.container} testID="analyzing-view">
      <View style={styles.hero} testID="analyzing-hero">
        <Animated.View
          pointerEvents="none"
          style={[
            styles.orbitRing,
            {
              opacity: pulseOpacity,
              transform: [{ rotate: spinRotate }, { scale: pulseScale }],
            },
          ]}
          testID="analyzing-orbit-ring"
        />
        <View style={styles.ringOuter} testID="analyzing-icon-plate">
          <View style={styles.iconWell}>
            <CozbilRobot
              animate={false}
              size={ICON_SIZE}
              testID="cozbil-robot"
              style={styles.icon}
            />
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
        {statusLabelForPhase(copy.phase)}
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
          const stepActive = checklistActive(s.id, copy.phase);
          const completed = checklistCompleted(s.id, activeRank) && !stepActive;
          return (
            <View
              key={s.id}
              style={[
                styles.stepRow,
                stepActive && styles.stepRowActive,
                completed && styles.stepRowDone,
              ]}>
              <View
                style={[
                  styles.stepDot,
                  stepActive && styles.stepDotActive,
                  completed && styles.stepDotDone,
                ]}>
                <Text style={styles.stepDotText}>
                  {completed ? '✓' : stepActive ? String(index + 1) : '·'}
                </Text>
              </View>
              <Text
                testID={`analyzing-step-${s.id}`}
                style={[
                  styles.stepItem,
                  stepActive && styles.stepActive,
                  completed && styles.stepDone,
                ]}>
                {checklistLabelFor(s.id, copy.phase, completed)}
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

function checklistActive(stepId: AnalyzeStepId, phase: LiveSolvePhase): boolean {
  if (stepId === 'upload') {
    return phase === 'preparing' || phase === 'upload' || phase === 'ocr';
  }
  if (stepId === 'moderate') return phase === 'moderate';
  return phase === 'solving' || phase === 'finishing';
}

function checklistCompleted(stepId: AnalyzeStepId, activeRank: number): boolean {
  if (stepId === 'upload') return activeRank > phaseRank('ocr');
  if (stepId === 'moderate') return activeRank > phaseRank('moderate');
  return false;
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
    width: RING_SIZE + 8,
    height: RING_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  /** Spinning accent arc — premium motion around the mark, not a filled plate. */
  orbitRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_RADIUS,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: colors.orange,
    borderRightColor: 'rgba(245, 158, 11, 0.35)',
  },
  /** Static hairline frame */
  ringOuter: {
    padding: 3,
    borderRadius: ICON_RADIUS + 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: colors.navy,
  },
  /** Navy well — never flash orange while the PNG decodes */
  iconWell: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    backgroundColor: colors.navy,
    borderWidth: 1.5,
    borderColor: colors.orange,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    borderRadius: ICON_RADIUS,
    backgroundColor: colors.navy,
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
