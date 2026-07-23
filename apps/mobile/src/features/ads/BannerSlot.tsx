import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/src/theme';

import { isLiveAdsDeliveryReady, resolveAdUnits } from './adUnits';
import { shouldShowBanner } from './policy';
import { isPremiumAudience } from './premiumGate';

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

  // Real <BannerAd> mounts in a follow-up once adMobEngine wiring ships.
  return (
    <View
      style={styles.wrap}
      testID="ads-banner-slot"
      accessibilityLabel="Reklam alanı">
      <Text style={styles.label}>Reklam</Text>
      <Text style={styles.hint}>Ücretsiz plan · Premium’da kapalı</Text>
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
    paddingVertical: 8,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: typography.captionWeight,
    color: colors.textSecondary,
  },
  hint: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
