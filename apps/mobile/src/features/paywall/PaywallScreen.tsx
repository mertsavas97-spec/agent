import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';

import { PAYWALL_COPY } from './copy';

export type PaywallScreenProps = {
  onStart: () => void;
  onDismiss: () => void;
};

export function PaywallScreen({ onStart, onDismiss }: PaywallScreenProps) {
  return (
    <View style={styles.root} testID="paywall-screen">
      <View style={styles.heroWash} />
      <Text style={styles.brand} testID="paywall-brand">
        {PAYWALL_COPY.brand}
      </Text>
      <Text style={styles.headline} testID="paywall-headline">
        {PAYWALL_COPY.headline}
      </Text>
      <Text style={styles.support}>{PAYWALL_COPY.support}</Text>

      <View style={styles.benefits}>
        <Text style={styles.benefit} testID="paywall-benefit-unlimited">
          {PAYWALL_COPY.benefits.unlimited}
        </Text>
        <Text style={styles.benefit} testID="paywall-benefit-ads">
          {PAYWALL_COPY.benefits.ads}
        </Text>
        <Text style={styles.benefit} testID="paywall-benefit-analysis">
          {PAYWALL_COPY.benefits.analysis}
        </Text>
      </View>

      <Text style={styles.price} testID="paywall-price">
        {PAYWALL_COPY.priceLabel}
      </Text>

      <Pressable
        testID="paywall-cta"
        accessibilityRole="button"
        style={styles.cta}
        onPress={onStart}>
        <Text style={styles.ctaText}>{PAYWALL_COPY.cta}</Text>
      </Pressable>

      <Pressable
        testID="paywall-dismiss"
        accessibilityRole="button"
        style={styles.dismiss}
        onPress={onDismiss}>
        <Text style={styles.dismissText}>{PAYWALL_COPY.dismiss}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
    paddingHorizontal: space.lg,
    paddingTop: space.xl * 2,
    paddingBottom: space.xl,
    justifyContent: 'flex-start',
  },
  heroWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.navy,
    // Atmospheric wash (expo-linear-gradient not in MVP deps)
    borderBottomWidth: 120,
    borderBottomColor: '#2A2660',
  },
  brand: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.headingWeight,
    fontSize: 28,
    color: colors.orange,
    marginBottom: space.sm,
    zIndex: 1,
  },
  headline: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.headingWeight,
    fontSize: 22,
    color: colors.white,
    marginBottom: space.md,
    zIndex: 1,
  },
  support: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.bodyWeight,
    fontSize: 15,
    lineHeight: 22,
    color: '#CBD5E1',
    marginBottom: space.lg,
    zIndex: 1,
  },
  benefits: {
    gap: space.sm,
    marginBottom: space.xl,
    zIndex: 1,
  },
  benefit: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.captionWeight,
    fontSize: 16,
    color: colors.white,
  },
  price: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.headingWeight,
    fontSize: 20,
    color: colors.orange,
    marginBottom: space.md,
    zIndex: 1,
  },
  cta: {
    backgroundColor: colors.orange,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
    zIndex: 1,
  },
  ctaText: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.headingWeight,
    fontSize: 17,
    color: colors.navy,
  },
  dismiss: {
    marginTop: space.md,
    paddingVertical: space.sm,
    alignItems: 'center',
    zIndex: 1,
  },
  dismissText: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.bodyWeight,
    fontSize: 14,
    color: '#94A3B8',
  },
});
