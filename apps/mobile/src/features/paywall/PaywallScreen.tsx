import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TR_EYEBROW } from '@/src/lib/trCase';
import { colors, radii, shadows, space, typography } from '@/src/theme';
import { Eyebrow } from '@/src/ui/Eyebrow';

import { PAYWALL_COPY } from './copy';
import {
  DEFAULT_PLAN_ID,
  PLANS,
  yearlySavingsTry,
  type PlanId,
  planById,
} from './pricing';

export type PaywallScreenProps = {
  onStart: (planId: PlanId) => void;
  onDismiss: () => void;
  onWatchRewarded?: () => void;
  onRestore?: () => void;
  onOpenLegal?: (doc: 'privacy' | 'terms') => void;
  initialPlanId?: PlanId;
  /** quota = hak bitti; browse = ayarlar/profil/ana sayfa */
  variant?: 'quota' | 'browse';
};

export function PaywallScreen({
  onStart,
  onDismiss,
  onWatchRewarded,
  onRestore,
  onOpenLegal,
  initialPlanId = DEFAULT_PLAN_ID,
  variant = 'quota',
}: PaywallScreenProps) {
  const [selected, setSelected] = useState<PlanId>(initialPlanId);
  const selectedPlan = planById(selected);
  const headline =
    variant === 'browse' ? PAYWALL_COPY.headlineBrowse : PAYWALL_COPY.headlineQuota;
  const support =
    variant === 'browse' ? PAYWALL_COPY.supportBrowse : PAYWALL_COPY.supportQuota;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.root}
      testID="paywall-screen"
      showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Eyebrow tone="orange">{TR_EYEBROW.premium}</Eyebrow>
        <Text style={styles.brand} testID="paywall-brand">
          {PAYWALL_COPY.brand}
        </Text>
        <Text style={styles.headline} testID="paywall-headline">
          {headline}
        </Text>
        <Text style={styles.support}>{support}</Text>
        <Text style={styles.proof}>{PAYWALL_COPY.socialProof}</Text>
      </View>

      <View style={styles.benefits}>
        {PAYWALL_COPY.benefits.map((b) => (
          <View key={b.id} style={styles.benefitCard} testID={`paywall-benefit-${b.id}`}>
            <Text style={styles.benefitTitle}>{b.title}</Text>
            <Text style={styles.benefitBody}>{b.body}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.plansLabel}>Planını seç</Text>
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
                <Text style={[styles.planTitle, isOn && styles.planTitleOn]}>
                  {plan.title}
                </Text>
                <Text style={[styles.planPrice, isOn && styles.planPriceOn]}>
                  {plan.priceLabel}
                </Text>
                {plan.effectiveMonthlyLabel ? (
                  <Text style={styles.planMeta}>{plan.effectiveMonthlyLabel}</Text>
                ) : null}
                {plan.compareAtLabel ? (
                  <Text style={styles.planCompare}>{plan.compareAtLabel}</Text>
                ) : null}
              </View>
              <View style={styles.planBadges}>
                {plan.saveLabel ? (
                  <Text style={styles.saveBadge}>{plan.saveLabel}</Text>
                ) : null}
                {plan.badge ? (
                  <Text style={styles.badge} testID={`paywall-badge-${plan.id}`}>
                    {plan.badge}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.selectedPrice} testID="paywall-price">
        {selectedPlan.priceLabel}
      </Text>
      <Text style={styles.savingsHint} testID="paywall-yearly-savings">
        Yıllıkta {yearlySavingsTry()} TL tasarruf · en avantajlı plan yıllık
      </Text>

      <Pressable
        testID="paywall-cta"
        accessibilityRole="button"
        style={styles.cta}
        onPress={() => onStart(selected)}>
        <Text style={styles.ctaText}>
          {selected === 'yearly' ? PAYWALL_COPY.ctaYearly : PAYWALL_COPY.cta}
        </Text>
      </Pressable>

      {onWatchRewarded ? (
        <Pressable
          testID="paywall-rewarded"
          accessibilityRole="button"
          style={styles.rewarded}
          onPress={onWatchRewarded}>
          <Text style={styles.rewardedText}>{PAYWALL_COPY.rewardedCta}</Text>
        </Pressable>
      ) : null}

      {onRestore ? (
        <Pressable testID="paywall-restore" onPress={onRestore} style={styles.linkBtn}>
          <Text style={styles.linkText}>{PAYWALL_COPY.restore}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.legalHint}>{PAYWALL_COPY.legalHint}</Text>
      <Text style={styles.guarantee}>{PAYWALL_COPY.guarantee}</Text>

      {onOpenLegal ? (
        <View style={styles.legalRow}>
          <Pressable onPress={() => onOpenLegal('privacy')}>
            <Text style={styles.legalLink}>Gizlilik</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => onOpenLegal('terms')}>
            <Text style={styles.legalLink}>Koşullar</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        testID="paywall-dismiss"
        accessibilityRole="button"
        style={styles.dismiss}
        onPress={onDismiss}>
        <Text style={styles.dismissText}>{PAYWALL_COPY.dismiss}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  root: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xl * 2,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: space.lg,
    marginBottom: space.lg,
    ...shadows.soft,
  },
  brand: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 28,
    fontWeight: '700',
    color: colors.orange,
    marginBottom: 8,
  },
  headline: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: space.sm,
    lineHeight: 30,
  },
  support: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    color: '#CBD5E1',
    marginBottom: space.sm,
  },
  proof: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.orange,
    lineHeight: 18,
  },
  benefits: { gap: space.sm, marginBottom: space.lg },
  benefitCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  benefitBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  plansLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    color: colors.navy,
    marginBottom: space.sm,
  },
  plans: { gap: space.sm, marginBottom: space.md },
  planRow: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  planRowOn: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  planTextCol: { flexShrink: 1, flex: 1 },
  planTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  planTitleOn: { color: colors.navy },
  planPrice: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  planPriceOn: { color: colors.navy },
  planMeta: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planCompare: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  planBadges: { alignItems: 'flex-end', gap: 4 },
  saveBadge: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  badge: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
    backgroundColor: colors.orange,
    overflow: 'hidden',
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  selectedPrice: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  savingsHint: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: space.md,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: colors.orange,
    borderRadius: radii.xl,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.cta,
  },
  ctaText: {
    fontFamily: typography.fontFamilySemiBold,
    fontWeight: '700',
    fontSize: 16,
    color: colors.navy,
  },
  rewarded: {
    marginTop: space.sm,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  rewardedText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    color: colors.navy,
  },
  linkBtn: { marginTop: space.md, alignItems: 'center' },
  linkText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 14,
    color: colors.navy,
    textDecorationLine: 'underline',
  },
  legalHint: {
    marginTop: space.md,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
  guarantee: {
    marginTop: 6,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: space.md,
  },
  legalLink: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.navy,
  },
  legalDot: { color: colors.textMuted },
  dismiss: {
    marginTop: space.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textMuted,
  },
});
