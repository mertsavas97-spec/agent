import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@/src/theme';
import { CozbilRobot } from '@/src/ui/CozbilRobot';

type PremiumSplashProps = {
  /** Optional status under the brand — keep short, never “demo/placeholder”. */
  status?: string | null;
  testID?: string;
};

const EXAM_STRIP = ['LGS', 'YKS', 'KPSS', 'Ehliyet'] as const;

/**
 * Full-bleed product splash — brand wordmark is the hero, mark supports it.
 * Not an icon-only plate; reads as a finished ÇözBil open, not a stub.
 */
export function PremiumSplash({
  status = null,
  testID = 'premium-splash',
}: PremiumSplashProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bar, {
        toValue: 1,
        duration: 900,
        delay: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [bar, fade, rise]);

  const barWidth = bar.interpolate({
    inputRange: [0, 1],
    outputRange: ['12%', '56%'],
  });

  return (
    <View style={styles.root} testID={testID} accessibilityRole="image">
      <View style={styles.washTop} />
      <View style={styles.washBottom} />
      <View style={styles.gridHint} />

      <Animated.View
        style={[
          styles.hero,
          { opacity: fade, transform: [{ translateY: rise }] },
        ]}>
        <View style={styles.markRow}>
          <CozbilRobot
            size={56}
            animate
            tone="onDark"
            testID="premium-splash-robot"
          />
        </View>

        <Text style={styles.wordmark} accessibilityRole="header">
          ÇözBil
        </Text>
        <Text style={styles.tagline}>Fotoğraftan adım adım sınav çözümü</Text>

        <Animated.View style={[styles.accentBar, { width: barWidth }]} />

        <View style={styles.examStrip} testID="premium-splash-exams">
          {EXAM_STRIP.map((label, i) => (
            <View key={label} style={styles.examItem}>
              {i > 0 ? <Text style={styles.examDot}>·</Text> : null}
              <Text style={styles.examLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <View style={styles.footer}>
        {status ? (
          <Text style={styles.status} testID="premium-splash-status">
            {status}
          </Text>
        ) : (
          <Text style={styles.footerQuiet}>Hazırlanıyor</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.navyDeep,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 100,
    elevation: 100,
  },
  washTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: '120%',
    height: '55%',
    backgroundColor: colors.navy,
    transform: [{ rotate: '-8deg' }],
  },
  washBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  gridHint: {
    ...StyleSheet.absoluteFill,
    opacity: 0.04,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    maxWidth: 360,
  },
  markRow: {
    marginBottom: space.md,
  },
  wordmark: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 44,
    lineHeight: 50,
    color: colors.textOnDark,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  tagline: {
    marginTop: space.sm,
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.size.md,
    lineHeight: 22,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  accentBar: {
    marginTop: space.lg,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.orange,
  },
  examStrip: {
    marginTop: space.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examDot: {
    color: 'rgba(245, 158, 11, 0.7)',
    marginHorizontal: 8,
    fontSize: 16,
    fontFamily: typography.fontFamilyBold,
  },
  examLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: typography.size.sm,
    color: colors.textOnDark,
    letterSpacing: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: space.lg,
    right: space.lg,
    alignItems: 'center',
  },
  status: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.size.sm,
    color: colors.orange,
    textAlign: 'center',
  },
  footerQuiet: {
    fontFamily: typography.fontFamily,
    fontSize: typography.size.sm,
    color: 'rgba(226, 232, 240, 0.45)',
    textAlign: 'center',
  },
});
