import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme';

import { GOOGLE_TEST_UNITS, isLiveAdsDeliveryReady, resolveAdUnits } from './adUnits';
import { shouldShowBanner } from './policy';
import { isPremiumAudience } from './premiumGate';

type BannerAdsModule = {
  BannerAd: ComponentType<{
    unitId: string;
    size: string;
    requestOptions?: Record<string, unknown>;
    onAdFailedToLoad?: (error: unknown) => void;
    onAdLoaded?: () => void;
  }>;
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: string; BANNER: string };
};

function loadBannerModule(): BannerAdsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads') as BannerAdsModule;
  } catch {
    return null;
  }
}

/**
 * Anchored banner for free tab shell.
 * Live unit first; __DEV__ no-fill falls back to Google sample banner.
 */
export function BannerSlot() {
  const [useTestFallback, setUseTestFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  const units = resolveAdUnits();
  const liveUnitId = Platform.OS === 'ios' ? units.bannerIos : units.bannerAndroid;
  const testUnitId =
    Platform.OS === 'ios' ? GOOGLE_TEST_UNITS.bannerIos : GOOGLE_TEST_UNITS.bannerAndroid;

  const unitId = useMemo(() => {
    if (useTestFallback && __DEV__) return testUnitId;
    return liveUnitId;
  }, [liveUnitId, testUnitId, useTestFallback]);

  if (!shouldShowBanner({ isPremium: isPremiumAudience() })) {
    return null;
  }
  if (!isLiveAdsDeliveryReady()) {
    return null;
  }
  if (failed || !unitId) return null;

  const ads = loadBannerModule();
  if (!ads?.BannerAd) return null;

  const size =
    ads.BannerAdSize?.ANCHORED_ADAPTIVE_BANNER ?? ads.BannerAdSize?.BANNER ?? 'BANNER';

  return (
    <View
      style={styles.wrap}
      testID="ads-banner-slot"
      accessibilityLabel="Reklam alanı">
      <ads.BannerAd
        key={unitId}
        unitId={unitId}
        size={size}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => {
          if (__DEV__) {
            console.info('ads: banner loaded', Platform.OS, useTestFallback ? 'test' : 'live');
          }
        }}
        onAdFailedToLoad={(error) => {
          console.warn('ads: banner failed', error);
          if (__DEV__ && !useTestFallback && testUnitId && testUnitId !== unitId) {
            console.info('ads: banner no-fill — retry Google test unit');
            setUseTestFallback(true);
            return;
          }
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
