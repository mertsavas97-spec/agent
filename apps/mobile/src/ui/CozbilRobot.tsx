import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

import { colors } from '@/src/theme';

export type CozbilRobotTone = 'onDark' | 'onLight';

export type CozbilRobotProps = {
  /** Soft breathe. Default true. */
  animate?: boolean;
  size?: number;
  /**
   * Kept for API compat. Brand mark is the official app icon (navy + white robot).
   * onDark / onLight no longer recolor geometry — same asset everywhere.
   */
  tone?: CozbilRobotTone;
  /** @deprecated use `tone` */
  variant?: CozbilRobotTone;
  testID?: string;
  style?: StyleProp<ImageStyle>;
};

/** Official ÇözBil app icon (robot mark) — 180px UI asset for instant decode. */
export const BRAND_MARK = require('../../assets/brand/app-icon/iOS/icon_180x180.png');
/** Full-res mark when a larger asset is needed (splash / marketing). */
export const BRAND_MARK_FULL = require('../../assets/images/brand-mark.png');

// Warm the image cache as soon as this module loads.
void BRAND_MARK;
const brandUri = Image.resolveAssetSource(BRAND_MARK)?.uri;
if (brandUri) {
  void Image.prefetch(brandUri);
}

/**
 * Brand mark from the official app icon pack.
 * Replaces the previous vector robot so onboarding / home / paywall match the store icon.
 */
export function CozbilRobot({
  animate = true,
  size = 104,
  tone: _tone,
  variant: _variant,
  testID = 'cozbil-robot',
  style,
}: CozbilRobotProps) {
  void _tone;
  void _variant;
  const pulse = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  const bouncePx = Math.max(2, Math.round(size * 0.04));
  const pulseTo = size < 56 ? 1.02 : 1.04;
  const radius = Math.round(size * 0.22);

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
    breathe.start();
    hop.start();
    return () => {
      breathe.stop();
      hop.stop();
    };
  }, [animate, bounce, bouncePx, pulse, pulseTo]);

  return (
    <Animated.View
      testID={testID}
      accessibilityLabel="ÇözBil"
      accessibilityRole="image"
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          transform: animate
            ? [{ scale: pulse }, { translateY: bounce }]
            : undefined,
        },
      ]}>
      <Image
        source={BRAND_MARK}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            // Match icon plate so a late decode never flashes white/orange.
            backgroundColor: colors.navy,
          },
          style,
        ]}
        resizeMode="cover"
        // Android defaults to a ~300ms fade-in — feels like the icon "arrives late"
        fadeDuration={0}
        // Avoid a blank/white decode frame on first paint (iOS).
        defaultSource={BRAND_MARK}
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.navy,
    // Avoid a blank frame while PNG decode finishes on cold navigations.
  },
});
