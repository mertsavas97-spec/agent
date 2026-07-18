import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, typography } from '@/src/theme';

import { PAYWALL_COPY } from './copy';
import { DEFAULT_PLAN_ID, PLANS, type PlanId, planById } from './pricing';

export type PaywallScreenProps = {
  onStart: (planId: PlanId) => void;
  onDismiss: () => void;
  initialPlanId?: PlanId;
};

export function PaywallScreen({
  onStart,
  onDismiss,
  initialPlanId = DEFAULT_PLAN_ID,
}: PaywallScreenProps) {
  const [selected, setSelected] = useState<PlanId>(initialPlanId);
  const selectedPlan = planById(selected);

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

      <View style={styles.plans} testID="paywall-plans">
        {PLANS.map((plan) => {
          const isOn = selected === plan.id;
          return (
            <Pressable
              key={plan.id}
              testID={`paywall-plan-${plan.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isOn }}
              style={[styles.planRow, isOn && styles.planRowOn]}
              onPress={() => setSelected(plan.id)}>
              <View style={styles.planTextCol}>
                <Text style={[styles.planPrice, isOn && styles.planPriceOn]}>
                  {plan.priceLabel}
                </Text>
                {plan.effectiveMonthlyLabel ? (
                  <Text style={styles.planMeta}>{plan.effectiveMonthlyLabel}</Text>
                ) : null}
              </View>
              {plan.badge ? (
                <Text style={styles.badge} testID={`paywall-badge-${plan.id}`}>
                  {plan.badge}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.price} testID="paywall-price">
        {selectedPlan.priceLabel}
      </Text>

      <Pressable
        testID="paywall-cta"
        accessibilityRole="button"
        style={styles.cta}
        onPress={() => onStart(selected)}>
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
    marginBottom: space.lg,
    zIndex: 1,
  },
  benefit: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.captionWeight,
    fontSize: 16,
    color: colors.white,
  },
  plans: {
    gap: space.sm,
    marginBottom: space.md,
    zIndex: 1,
  },
  planRow: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: radii.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planRowOn: {
    borderColor: colors.orange,
    backgroundColor: '#2A2660',
  },
  planTextCol: {
    flexShrink: 1,
  },
  planPrice: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.captionWeight,
    fontSize: 15,
    color: '#E2E8F0',
  },
  planPriceOn: {
    color: colors.white,
  },
  planMeta: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.captionWeight,
    fontSize: 11,
    color: colors.navy,
    backgroundColor: colors.orange,
    overflow: 'hidden',
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  price: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.headingWeight,
    fontSize: 18,
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
