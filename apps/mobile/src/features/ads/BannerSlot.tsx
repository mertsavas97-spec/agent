import type { ComponentType } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors } from '@/src/theme';

import { isLiveAdsDeliveryReady, resolveAdUnits } from './adUnits';
import { shouldShowBanner } from './policy';
import { isPremiumAudience } from './premiumGate';

type BannerAdsModule = {
  BannerAd: ComponentType<{
    unitId: string;
    size: string;
    requestOptions?: Record<string, unknown>;
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
 * Hidden until live AdMob delivery is ready — no “hazırlık” placeholder in store builds.
 */
export function BannerSlot() {
  if (!shouldShowBanner({ isPremium: isPremiumAudience() })) {
    return null;
  }
  if (!isLiveAdsDeliveryReady()) {
    return null;
  }

  const units = resolveAdUnits();
  const unitId = Platform.OS === 'ios' ? units.bannerIos : units.bannerAndroid;
  if (!unitId) return null;

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
        unitId={unitId}
        size={size}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
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
