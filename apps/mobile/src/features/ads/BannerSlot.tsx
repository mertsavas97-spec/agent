import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/src/theme';

import { shouldShowBanner } from './policy';
import { isPremiumAudience } from './premiumGate';

/**
 * Anchored banner placeholder for free tab shell.
 * Replace inner view with AdMob <BannerAd> after EAS + unit ids.
 */
export function BannerSlot() {
  if (!shouldShowBanner({ isPremium: isPremiumAudience() })) {
    return null;
  }

  return (
    <View style={styles.wrap} testID="ads-banner-slot" accessibilityLabel="Reklam alanı">
      <Text style={styles.label}>Reklam</Text>
      <Text style={styles.hint}>Banner (ücretsiz) · Premium’da kapalı</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 50,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
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
    color: '#94A3B8',
  },
});
