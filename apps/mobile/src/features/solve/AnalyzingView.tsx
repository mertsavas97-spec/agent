import { useEffect, useMemo, useRef, useState } from 'react';
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
  /** Optional status under the tip — e.g. multi-batch "Soru 2/5 hazır" */
  statusLine?: string | null;
};

const TIPS = [
  'Birkaç saniye — öğretmen gibi adım adım hazırlıyorum.',
  'Net fotoğraf = daha net çözüm. Soru ve şıklar tam görünsün.',
  'Diyagramlı sorularda metin yetmezse dürüstçe söylerim.',
  'Sonra “Anlamadım” dersen daha sade anlatırım.',
];

/**
 * Moodboard loading: brand mark on a light plate (separates from navy),
 * monotonic progress, orbit accents, shimmer — no progress bounce-back.
 */
export function AnalyzingView({ step = 'upload', statusLine }: AnalyzingViewProps) {
  const baseTarget = progressForStep(step);
  const anim = useRef(new Animated.Value(0.08)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(1)).current;
  const [displayPct, setDisplayPct] = useState(8);
  const [tipIndex, setTipIndex] = useState(0);
  const peakRef = useRef(0.08);

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
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, baseTarget]);

  // On solve stage: crawl slowly toward 92% (live Vertex can take ~60s).
  useEffect(() => {
    if (step !== 'solve') return;
    const crawl = Animated.timing(anim, {
      toValue: 0.92,
      duration: 55_000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    crawl.start();
    return () => crawl.stop();
  }, [anim, step]);

  useEffect(() => {
    // Subtle settle without hiding the mark (opacity stays 1).
    enter.setValue(0.94);
    Animated.spring(enter, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();

    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const orbitLoop = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 7200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    haloLoop.start();
    shimmerLoop.start();
    orbitLoop.start();
    return () => {
      haloLoop.stop();
      shimmerLoop.stop();
      orbitLoop.stop();
    };
  }, [enter, halo, orbit, shimmer]);

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

  const haloScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const haloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });
  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 220],
  });
  const orbitRotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const orbitDots = useMemo(
    () =>
      [0, 120, 240].map((deg) => (
        <View
          key={deg}
          style={[
            styles.orbitDot,
            {
              transform: [{ rotate: `${deg}deg` }, { translateY: -64 }],
            },
          ]}
        />
      )),
    [],
  );

  return (
    <View style={styles.container} testID="analyzing-view">
      <View style={styles.ambientA} pointerEvents="none" />
      <View style={styles.ambientB} pointerEvents="none" />

      <Animated.View
        style={[
          styles.hero,
          {
            transform: [{ scale: enter }],
          },
        ]}
        testID="analyzing-hero">
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
          pointerEvents="none"
        />
        <Animated.View
          style={[styles.orbitRing, { transform: [{ rotate: orbitRotate }] }]}
          pointerEvents="none">
          {orbitDots}
        </Animated.View>
        {/* Light plate separates navy brand mark from navy screen */}
        <View style={styles.iconPlate} testID="analyzing-icon-plate">
          <View style={styles.iconInner}>
            <CozbilRobot size={88} animate tone="onDark" testID="cozbil-robot" />
          </View>
        </View>
      </Animated.View>

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
        <Animated.View style={[styles.barFill, { width: widthInterp }]}>
          <Animated.View
            style={[
              styles.barShimmer,
              { transform: [{ translateX: shimmerX }, { skewX: '-18deg' }] },
            ]}
          />
        </Animated.View>
      </View>
      <Text style={styles.pct} testID="analyzing-progress-pct">
        %{displayPct}
      </Text>

      <Animated.Text style={[styles.tip, { opacity: tipOpacity }]} testID="analyzing-tip">
        {TIPS[tipIndex]}
      </Animated.Text>

      {statusLine ? (
        <Text style={styles.statusLine} testID="analyzing-status-line">
          {statusLine}
        </Text>
      ) : null}

      <View style={styles.steps} testID="analyzing-steps">
        {ANALYZE_STEPS.map((s, index) => {
          const active = s.id === step;
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    overflow: 'hidden',
  },
  ambientA: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.orange,
    opacity: 0.1,
  },
  ambientB: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#6366F1',
    opacity: 0.12,
  },
  hero: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  halo: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  orbitRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.orange,
    opacity: 0.85,
  },
  iconPlate: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.55)',
    shadowColor: colors.orange,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    color: 'rgba(226, 232, 240, 0.85)',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  barShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: 'rgba(255,255,255,0.35)',
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
    color: 'rgba(226, 232, 240, 0.8)',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  stepRowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  stepRowDone: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepDotActive: {
    backgroundColor: colors.orange,
  },
  stepDotDone: {
    backgroundColor: 'rgba(22, 163, 74, 0.85)',
  },
  stepDotText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
  },
  stepItem: {
    color: 'rgba(148, 163, 184, 0.95)',
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
    color: 'rgba(203, 213, 225, 0.9)',
  },
});
