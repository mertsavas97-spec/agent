/**
 * Subscription entitlement stub (US6 / T051).
 * Pricing SKUs: docs/product/pricing-policy.md
 *
 * Play Billing not wired yet. Production path:
 * 1. Create base plans / products in Play Console (weekly intro, monthly, yearly).
 * 2. Purchase selected productId; verify token server-side.
 * 3. Set users/{uid}.subscriptionStatus to active | grace | expired.
 *
 * Local sandbox: EXPO_PUBLIC_PREMIUM_SANDBOX=1
 */

import { planById, type PlanId, PRICING } from './pricing';

export type EntitlementStatus = 'free' | 'active' | 'grace' | 'expired';

export type EntitlementSnapshot = {
  status: EntitlementStatus;
  source: 'stub' | 'sandbox' | 'play';
  productId: string | null;
};

export function readLocalEntitlement(): EntitlementSnapshot {
  if (process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1') {
    return {
      status: 'active',
      source: 'sandbox',
      productId: PRICING.monthly.productId,
    };
  }
  return { status: 'free', source: 'stub', productId: null };
}

export async function startPremiumPurchase(planId: PlanId = 'yearly'): Promise<{
  ok: boolean;
  reason: 'sandbox' | 'billing_not_configured';
  productId: string;
}> {
  const productId = planById(planId).productId;
  if (process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1') {
    return { ok: true, reason: 'sandbox', productId };
  }
  return { ok: false, reason: 'billing_not_configured', productId };
}
