import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme';

export type CozbilRobotProps = {
  /** Soft scale breathe — loading screens. */
  animate?: boolean;
  size?: number;
  /** onDark = white head (navy loading). onLight = navy head (surface). */
  variant?: 'onDark' | 'onLight';
  testID?: string;
};

/**
 * Moodboard maskot: yuvarlak robot kafa, turuncu anten, gülümseyen ağız.
 * Sıcak AI arkadaşı — abartılı çocuk çizgi film değil.
 */
export function CozbilRobot({
  animate = true,
  size = 104,
  variant = 'onDark',
  testID = 'cozbil-robot',
}: CozbilRobotProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const headBg = variant === 'onLight' ? colors.navy : colors.white;
  const eyeBg = variant === 'onLight' ? colors.white : colors.navy;

  useEffect(() => {
    if (!animate) return;
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const hop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -6,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const wink = Animated.loop(
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(blink, { toValue: 0.15, duration: 90, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.delay(1800),
      ]),
    );
    breathe.start();
    hop.start();
    wink.start();
    return () => {
      breathe.stop();
      hop.stop();
      wink.stop();
    };
  }, [animate, blink, bounce, pulse]);

  const eye = Math.max(10, Math.round(size * 0.13));
  const eyeGap = Math.round(size * 0.17);
  const antennaH = Math.round(size * 0.18);
  const antennaBall = Math.max(8, Math.round(size * 0.1));

  return (
    <Animated.View
      testID={testID}
      accessibilityLabel="ÇözBil robot arkadaşın"
      style={[
        styles.wrap,
        {
          width: size,
          height: size + antennaH,
          transform: animate
            ? [{ scale: pulse }, { translateY: bounce }]
            : undefined,
        },
      ]}>
      <View style={[styles.antennaStem, { height: antennaH - antennaBall / 2 }]} />
      <View
        style={[
          styles.antennaBall,
          {
            width: antennaBall,
            height: antennaBall,
            borderRadius: antennaBall / 2,
            top: 0,
          },
        ]}
      />
      <View
        style={[
          styles.head,
          {
            width: size,
            height: size,
            borderRadius: size * 0.28,
            marginTop: antennaH - 4,
            backgroundColor: headBg,
          },
        ]}>
        <View style={[styles.eyeRow, { gap: eyeGap, marginBottom: size * 0.1 }]}>
          <Animated.View
            style={[
              styles.eye,
              {
                width: eye,
                height: eye,
                borderRadius: eye / 2,
                backgroundColor: eyeBg,
                transform: [{ scaleY: blink }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.eye,
              {
                width: eye,
                height: eye,
                borderRadius: eye / 2,
                backgroundColor: eyeBg,
                transform: [{ scaleY: blink }],
              },
            ]}
          />
        </View>
        <View style={styles.smileWrap}>
          <View
            style={[
              styles.smile,
              {
                width: size * 0.34,
                height: size * 0.2,
                borderBottomLeftRadius: size * 0.2,
                borderBottomRightRadius: size * 0.2,
              },
            ]}
          />
        </View>
        <View style={[styles.cheek, styles.cheekL, { top: size * 0.52 }]} />
        <View style={[styles.cheek, styles.cheekR, { top: size * 0.52 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  antennaStem: {
    position: 'absolute',
    top: 10,
    width: 3,
    backgroundColor: colors.orange,
    zIndex: 1,
  },
  antennaBall: {
    position: 'absolute',
    backgroundColor: colors.orange,
    zIndex: 2,
  },
  head: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  eyeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eye: {},
  smileWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 18,
  },
  smile: {
    borderWidth: 3.5,
    borderColor: colors.orange,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  cheek: {
    position: 'absolute',
    width: 10,
    height: 6,
    borderRadius: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.35)',
  },
  cheekL: { left: 14 },
  cheekR: { right: 14 },
});
