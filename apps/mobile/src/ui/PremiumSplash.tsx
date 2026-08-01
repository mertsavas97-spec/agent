import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';

type PremiumSplashProps = {
  /** Optional status under the brand — keep short, never “demo/placeholder”. */
  status?: string | null;
  testID?: string;
};

/**
 * Full-bleed navy brand splash — same visual language as store icon + analyzing.
 * Used while bootstrap settles so the cold start never looks like a gray stub.
 */
export function PremiumSplash({
  status = null,
  testID = 'premium-splash',
}: PremiumSplashProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(10)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    const spin = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 10_000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [fade, rise, ring]);

  const rotate = ring.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root} testID={testID} accessibilityRole="image">
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      <Animated.View
        style={[
          styles.hero,
          { opacity: fade, transform: [{ translateY: rise }] },
        ]}>
        <Animated.View
          style={[styles.orbit, { transform: [{ rotate }] }]}
          testID="premium-splash-orbit"
        />
        <View style={styles.markWell}>
          <CozbilRobot
            size={96}
            animate
            tone="onDark"
            testID="premium-splash-robot"
          />
        </View>
        <Text style={styles.wordmark} accessibilityRole="header">
          ÇözBil
        </Text>
        <Text style={styles.tagline}>Adım adım sınav çözümü</Text>
        {status ? (
          <Text style={styles.status} testID="premium-splash-status">
            {status}
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 100,
    elevation: 100,
  },
  glowA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    top: '18%',
    left: '-10%',
  },
  glowB: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    bottom: '8%',
    right: '-16%',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  orbit: {
    position: 'absolute',
    top: -18,
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderStyle: 'dashed',
  },
  markWell: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyDeep,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.55)',
    marginBottom: space.md,
  },
  wordmark: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.size.display,
    color: colors.textOnDark,
    letterSpacing: 0.4,
  },
  tagline: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.size.md,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
  },
  status: {
    marginTop: space.md,
    fontFamily: typography.fontFamily,
    fontSize: typography.size.sm,
    color: 'rgba(245, 158, 11, 0.9)',
    textAlign: 'center',
  },
});
