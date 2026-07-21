/**
 * Canonical Premium pricing — docs/product/pricing-policy.md
 * Aylık kilit: 39 TL. Yıllıkta güçlü indirim.
 */

export type PlanId = 'week' | 'monthly' | 'yearly';

export type PricingPlan = {
  id: PlanId;
  productId: string;
  priceTry: number;
  periodLabel: string;
  priceLabel: string;
  title: string;
  badge?: string;
  effectiveMonthlyLabel?: string;
  saveLabel?: string;
  compareAtLabel?: string;
};

/** 12 × 39 = 468 → yıllık 320 ≈ %32 indirim (ayda ≈26,7 TL) */
export const PRICING = {
  currency: 'TRY',
  freeDailySolves: 5,
  week: {
    id: 'week' as const,
    productId: 'cozbil_premium_weekly_intro',
    priceTry: 14.9,
    periodLabel: '7 gün',
    title: 'Haftalık',
    priceLabel: '14,90 TL / 7 gün',
    badge: 'Dene',
  },
  monthly: {
    id: 'monthly' as const,
    productId: 'cozbil_premium_monthly',
    priceTry: 39,
    periodLabel: 'ay',
    title: 'Aylık',
    priceLabel: '39 TL / ay',
  },
  yearly: {
    id: 'yearly' as const,
    productId: 'cozbil_premium_yearly',
    priceTry: 320,
    periodLabel: 'yıl',
    title: 'Yıllık',
    priceLabel: '320 TL / yıl',
    badge: 'En avantajlı',
    effectiveMonthlyLabel: 'Ayda yalnızca ≈27 TL',
    saveLabel: '%32 indirim',
    compareAtLabel: '468 TL yerine',
  },
} as const;

export const DEFAULT_PLAN_ID: PlanId = 'yearly';

export const PLANS: PricingPlan[] = [PRICING.week, PRICING.monthly, PRICING.yearly];

export function planById(id: PlanId): PricingPlan {
  return PLANS.find((p) => p.id === id) ?? PRICING.yearly;
}

export function yearlySavingsTry(): number {
  return Math.round(PRICING.monthly.priceTry * 12 - PRICING.yearly.priceTry);
}

/** Display % off vs 12× monthly (rounded). */
export function yearlyDiscountPercent(): number {
  const full = PRICING.monthly.priceTry * 12;
  return Math.round(((full - PRICING.yearly.priceTry) / full) * 100);
}
