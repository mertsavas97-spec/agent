import { SymbolView } from 'expo-symbols';
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
import { CozbilRobot } from '@/src/ui/CozbilRobot';
import { Eyebrow } from '@/src/ui/Eyebrow';
import { hapticLight, hapticMedium, hapticSelection } from '@/src/ui/haptics';

import { PAYWALL_COPY } from './copy';
import {
  DEFAULT_PLAN_ID,
  PLANS,
  PRICING,
  yearlyDiscountPercent,
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
  const discountPct = yearlyDiscountPercent();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.root}
      testID="paywall-screen"
      showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <CozbilRobot size={48} animate tone="onDark" testID="paywall-robot" />
          <View style={styles.heroTitles}>
            <Eyebrow tone="orange">{TR_EYEBROW.premium}</Eyebrow>
            <Text style={styles.brand} testID="paywall-brand">
              {PAYWALL_COPY.brand}
            </Text>
          </View>
          <SymbolView
            name={{ ios: 'crown.fill', android: 'workspace_premium', web: 'workspace_premium' }}
            tintColor={colors.orange}
            size={26}
          />
        </View>
        <Text style={styles.headline} testID="paywall-headline">
          {headline}
        </Text>
        <Text style={styles.support}>{support}</Text>

        <View style={styles.offerCard} testID="paywall-offer">
          <Text style={styles.offerKicker}>Yıllık · en avantajlı</Text>
          <View style={styles.offerPriceRow}>
            <Text style={styles.offerPrice}>{PRICING.yearly.priceLabel}</Text>
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>%{discountPct} indirim</Text>
            </View>
          </View>
          <Text style={styles.offerMeta}>
            {PRICING.yearly.compareAtLabel} · {PRICING.yearly.effectiveMonthlyLabel}
          </Text>
        </View>
      </View>

      <View style={styles.plansSection}>
        <Text style={styles.plansLabel}>Planını seç</Text>
        <View style={styles.plans} testID="paywall-plans">
          {PLANS.map((plan) => {
            const isOn = selected === plan.id;
            const featured = plan.id === 'yearly';
            return (
              <Pressable
                key={plan.id}
                testID={`paywall-plan-${plan.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isOn }}
                style={[
                  styles.planRow,
                  featured && styles.planRowFeatured,
                  isOn && styles.planRowOn,
                ]}
                onPress={() => {
                  void hapticSelection();
                  setSelected(plan.id);
                }}>
                <View style={[styles.radio, isOn && styles.radioOn]}>
                  {isOn ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.planTextCol}>
                  <View style={styles.planTitleRow}>
                    <Text style={[styles.planTitle, isOn && styles.planTitleOn]}>
                      {plan.title}
                    </Text>
                    {plan.badge ? (
                      <Text style={styles.badge} testID={`paywall-badge-${plan.id}`}>
                        {plan.badge}
                      </Text>
                    ) : null}
                  </View>
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
                {plan.saveLabel ? (
                  <Text style={styles.saveBadge}>{plan.saveLabel}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.checkout}>
        <Text style={styles.selectedPrice} testID="paywall-price">
          {selectedPlan.priceLabel}
        </Text>
        <Text style={styles.savingsHint} testID="paywall-yearly-savings">
          Yıllıkta {yearlySavingsTry()} TL tasarruf · %{discountPct} indirim
        </Text>

        <Pressable
          testID="paywall-cta"
          accessibilityRole="button"
          style={styles.cta}
          onPress={() => {
            void hapticMedium();
            onStart(selected);
          }}>
          <SymbolView
            name={{ ios: 'crown.fill', android: 'workspace_premium', web: 'workspace_premium' }}
            tintColor={colors.navy}
            size={18}
          />
          <Text style={styles.ctaText}>
            {selected === 'yearly' ? PAYWALL_COPY.ctaYearly : PAYWALL_COPY.cta}
          </Text>
        </Pressable>
      </View>

      <View style={styles.benefitsPanel}>
        <Text style={styles.benefitsHeading}>Premium’da neler var?</Text>
        {PAYWALL_COPY.benefits.map((b, index) => (
          <View
            key={b.id}
            style={[
              styles.benefitRow,
              index < PAYWALL_COPY.benefits.length - 1 && styles.benefitRowBorder,
            ]}
            testID={`paywall-benefit-${b.id}`}>
            <View style={styles.benefitIconWrap}>
              <SymbolView name={b.icon} tintColor={colors.orange} size={18} />
            </View>
            <View style={styles.benefitCopy}>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitBody}>{b.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {onWatchRewarded ? (
        <Pressable
          testID="paywall-rewarded"
          accessibilityRole="button"
          style={styles.rewarded}
          onPress={() => {
            void hapticLight();
            onWatchRewarded();
          }}>
          <Text style={styles.rewardedText}>{PAYWALL_COPY.rewardedCta}</Text>
        </Pressable>
      ) : null}

      {onRestore ? (
        <Pressable
          testID="paywall-restore"
          onPress={() => {
            void hapticLight();
            onRestore();
          }}
          style={styles.linkBtn}>
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
        onPress={() => {
          void hapticLight();
          onDismiss();
        }}>
        <Text style={styles.dismissText}>{PAYWALL_COPY.dismiss}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  root: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xl * 2,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: space.md,
    marginBottom: space.md,
    overflow: 'hidden',
    ...shadows.soft,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.orange,
    opacity: 0.12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.sm,
  },
  heroTitles: { flex: 1 },
  brand: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginTop: 2,
  },
  headline: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
    lineHeight: 24,
  },
  support: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: '#CBD5E1',
    marginBottom: 6,
  },
  offerCard: {
    marginTop: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.orange,
    padding: space.md,
  },
  offerKicker: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.orange,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  offerPrice: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  offerBadge: {
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offerBadgeText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  offerMeta: {
    marginTop: 6,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#CBD5E1',
  },
  benefitsPanel: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  benefitsHeading: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    paddingVertical: space.sm,
    paddingHorizontal: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: 4,
  },
  benefitRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  benefitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: { flex: 1, paddingTop: 2 },
  benefitTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 2,
  },
  benefitBody: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  plansSection: {
    marginBottom: space.md,
  },
  plansLabel: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: space.sm,
  },
  plans: { gap: space.sm },
  planRow: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.white,
  },
  planRowFeatured: {
    borderColor: '#FCD34D',
  },
  planRowOn: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.orange,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  planTextCol: { flexShrink: 1, flex: 1 },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  planTitle: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    color: colors.textMuted,
  },
  planTitleOn: { color: colors.navy, fontWeight: '700' },
  planPrice: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 2,
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
  saveBadge: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    alignSelf: 'flex-start',
  },
  badge: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 10,
    fontWeight: '700',
    color: colors.navy,
    backgroundColor: colors.orange,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  checkout: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.sm,
    ...shadows.soft,
  },
  selectedPrice: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  savingsHint: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.success,
    marginBottom: space.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.orange,
    borderRadius: radii.xl,
    paddingVertical: 16,
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
