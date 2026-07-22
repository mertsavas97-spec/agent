import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/src/theme';

import { adsStubForced, resolveAdUnits } from './adUnits';
import { shouldShowBanner } from './policy';
import { isPremiumAudience } from './premiumGate';

/**
 * Anchored banner for free tab shell.
 * Real AdMob <BannerAd> mounts after EAS + unit ids + SDK install.
 */
export function BannerSlot() {
  if (!shouldShowBanner({ isPremium: isPremiumAudience() })) {
    return null;
  }

  const units = resolveAdUnits();
  const unitId =
    Platform.OS === 'ios' ? units.bannerIos : units.bannerAndroid;
  const stub = adsStubForced() || !unitId;

  return (
    <View
      style={styles.wrap}
      testID="ads-banner-slot"
      accessibilityLabel={stub ? 'Reklam alanı yer tutucu' : 'Reklam alanı'}>
      <Text style={styles.label}>{stub ? 'Reklam alanı · hazırlık' : 'Reklam'}</Text>
      <Text style={styles.hint}>
        {stub
          ? 'Ücretsiz planda banner · Premium’da kapalı · AdMob unit id + SDK sonrası canlı'
          : 'Ücretsiz plan · Premium’da kapalı'}
      </Text>
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
