import { Image, StyleSheet, View } from 'react-native';

import { BRAND_MARK, BRAND_MARK_FULL } from '@/src/ui/CozbilRobot';

/**
 * Mount once at app root so brand PNGs decode before Settings/Profile navigate.
 * Keeps a 1×1 offscreen Image warm in the native image cache.
 */
export function BrandMarkCache() {
  return (
    <View style={styles.cache} pointerEvents="none" testID="brand-mark-cache">
      <Image source={BRAND_MARK} style={styles.pixel} fadeDuration={0} defaultSource={BRAND_MARK} />
      <Image
        source={BRAND_MARK_FULL}
        style={styles.pixel}
        fadeDuration={0}
        defaultSource={BRAND_MARK_FULL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cache: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  pixel: {
    width: 1,
    height: 1,
  },
});
