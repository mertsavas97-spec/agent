/**
 * Subscription entitlement stub (US6 / T051).
 *
 * Play Billing (`react-native-iap` / Google Play Billing Library) is not wired
 * in this MVP slice. Production path:
 * 1. Install billing SDK (Context7: verify current Expo-compatible package).
 * 2. Purchase product id `cozbil_premium_monthly` in Play Console license testers.
 * 3. Call Cloud Function `syncSubscription` with purchase token.
 * 4. Backend sets `users/{uid}.subscriptionStatus` to `active` | `grace` | `expired`.
 *
 * Local sandbox: flip `EXPO_PUBLIC_PREMIUM_SANDBOX=1` to simulate entitlement
 * so solve quota is bypassed client-side for dogfood (server still authoritative).
 */

export type EntitlementStatus = 'free' | 'active' | 'grace' | 'expired';

export type EntitlementSnapshot = {
  status: EntitlementStatus;
  source: 'stub' | 'sandbox' | 'play';
  productId: string | null;
};

const PREMIUM_PRODUCT_ID = 'cozbil_premium_monthly';

export function readLocalEntitlement(): EntitlementSnapshot {
  if (process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1') {
    return { status: 'active', source: 'sandbox', productId: PREMIUM_PRODUCT_ID };
  }
  return { status: 'free', source: 'stub', productId: null };
}

/** Stub purchase — returns sandbox success when env flag is on; else "not configured". */
export async function startPremiumPurchase(): Promise<{
  ok: boolean;
  reason: 'sandbox' | 'billing_not_configured';
}> {
  if (process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1') {
    return { ok: true, reason: 'sandbox' };
  }
  return { ok: false, reason: 'billing_not_configured' };
}

export { PREMIUM_PRODUCT_ID };
