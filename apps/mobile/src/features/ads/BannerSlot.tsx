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
      <Text style={styles.label}>Reklam alanı</Text>
      <Text style={styles.hint}>Ücretsiz planda görünür · Premium’da kapalı</Text>
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
  },
});
