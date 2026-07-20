import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme';

export type CozbilRobotTone = 'onDark' | 'onLight';

export type CozbilRobotProps = {
  /** Soft breathe + blink. Default true (Premium-style presence). */
  animate?: boolean;
  size?: number;
  /**
   * Only swaps fill colors for contrast — silhouette stays identical.
   * onDark → white head (navy / Premium / loading)
   * onLight → navy head (surface / Ana Sayfa)
   */
  tone?: CozbilRobotTone;
  /** @deprecated use `tone` */
  variant?: CozbilRobotTone;
  testID?: string;
};

/**
 * Tek tip ÇözBil maskot: yuvarlak kafa, turuncu anten, gülümseme.
 * Tasarım sabit; yalnızca tone ile renkler arka plana uyum sağlar.
 */
export function CozbilRobot({
  animate = true,
  size = 104,
  tone,
  variant,
  testID = 'cozbil-robot',
}: CozbilRobotProps) {
  const resolvedTone: CozbilRobotTone = tone ?? variant ?? 'onDark';
  const pulse = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;

  // Single palette swap — same geometry everywhere
  const headBg = resolvedTone === 'onLight' ? colors.navy : colors.white;
  const eyeBg = resolvedTone === 'onLight' ? colors.white : colors.navy;
  const accent = colors.orange;

  // Motion intensity scales with size so home (40) stays subtle
  const bouncePx = Math.max(2, Math.round(size * 0.055));
  const pulseTo = size < 56 ? 1.03 : 1.05;

  useEffect(() => {
    if (!animate) return;
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: pulseTo,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const hop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -bouncePx,
          duration: 750,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 750,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const wink = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(blink, { toValue: 0.12, duration: 90, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 130, useNativeDriver: true }),
        Animated.delay(2000),
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
  }, [animate, blink, bounce, bouncePx, pulse, pulseTo]);

  // All facial metrics proportional to size (one silhouette)
  const antennaH = Math.round(size * 0.18);
  const antennaBall = Math.max(6, Math.round(size * 0.1));
  const antennaStemW = Math.max(2, Math.round(size * 0.03));
  const eye = Math.max(6, Math.round(size * 0.13));
  const eyeGap = Math.round(size * 0.17);
  const smileW = size * 0.34;
  const smileH = size * 0.2;
  const smileBorder = Math.max(2, size * 0.034);
  const cheekW = Math.max(5, Math.round(size * 0.1));
  const cheekH = Math.max(3, Math.round(size * 0.06));
  const cheekInset = Math.round(size * 0.14);
  const cheekTop = size * 0.52;
  const radius = size * 0.28;

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
      <View
        style={[
          styles.antennaStem,
          {
            height: antennaH - antennaBall / 2,
            width: antennaStemW,
            top: Math.round(size * 0.1),
            backgroundColor: accent,
          },
        ]}
      />
      <View
        style={[
          styles.antennaBall,
          {
            width: antennaBall,
            height: antennaBall,
            borderRadius: antennaBall / 2,
            top: 0,
            backgroundColor: accent,
          },
        ]}
      />
      <View
        style={[
          styles.head,
          {
            width: size,
            height: size,
            borderRadius: radius,
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
        <View style={[styles.smileWrap, { height: smileH }]}>
          <View
            style={[
              styles.smile,
              {
                width: smileW,
                height: smileH,
                borderBottomLeftRadius: smileH,
                borderBottomRightRadius: smileH,
                borderWidth: smileBorder,
                borderColor: accent,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.cheek,
            {
              width: cheekW,
              height: cheekH,
              borderRadius: cheekH / 2,
              top: cheekTop,
              left: cheekInset,
              backgroundColor: 'rgba(245, 158, 11, 0.35)',
            },
          ]}
        />
        <View
          style={[
            styles.cheek,
            {
              width: cheekW,
              height: cheekH,
              borderRadius: cheekH / 2,
              top: cheekTop,
              right: cheekInset,
              backgroundColor: 'rgba(245, 158, 11, 0.35)',
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  antennaStem: {
    position: 'absolute',
    zIndex: 1,
  },
  antennaBall: {
    position: 'absolute',
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
  },
  smile: {
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  cheek: {
    position: 'absolute',
  },
});
