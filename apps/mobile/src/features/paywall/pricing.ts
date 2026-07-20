/**
 * Canonical Premium pricing — see docs/product/pricing-policy.md
 * Amounts in TRY major units (display). Play Console mirrors these SKUs.
 */

export type PlanId = 'week' | 'monthly' | 'yearly';

export type PricingPlan = {
  id: PlanId;
  productId: string;
  priceTry: number;
  periodLabel: string;
  priceLabel: string;
  badge?: string;
  effectiveMonthlyLabel?: string;
};

export const PRICING = {
  currency: 'TRY',
  freeDailySolves: 5,
  week: {
    id: 'week' as const,
    productId: 'cozbil_premium_weekly_intro',
    priceTry: 14.9,
    periodLabel: '7 gün',
    priceLabel: '14,90 TL / 7 gün',
  },
  monthly: {
    id: 'monthly' as const,
    productId: 'cozbil_premium_monthly',
    priceTry: 39,
    periodLabel: 'ay',
    priceLabel: '39 TL / ay',
  },
  yearly: {
    id: 'yearly' as const,
    productId: 'cozbil_premium_yearly',
    priceTry: 349,
    periodLabel: 'yıl',
    priceLabel: '349 TL / yıl',
    badge: 'En avantajlı',
    effectiveMonthlyLabel: 'Ayda ≈29 TL',
  },
} as const;

export const DEFAULT_PLAN_ID: PlanId = 'yearly';

export const PLANS: PricingPlan[] = [PRICING.week, PRICING.monthly, PRICING.yearly];

export function planById(id: PlanId): PricingPlan {
  return PLANS.find((p) => p.id === id) ?? PRICING.yearly;
}
