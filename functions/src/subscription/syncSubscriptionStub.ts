/**
 * Play Billing entitlement sync stub (US6 / T051) — pure decision helper.
 * Production path: `syncSubscription.ts` + `verifyPlayPurchase.ts`.
 */

import type { QuotaState } from '../quota/dailyQuota';

export type SyncSubscriptionInput = {
  uid: string;
  purchaseToken?: string;
  sandboxActive?: boolean;
};

export type SyncSubscriptionResult = {
  subscriptionStatus: QuotaState['subscriptionStatus'];
  productId: string | null;
  synced: boolean;
};

const DEFAULT_SANDBOX_PRODUCT = 'cozbil_premium_yearly';

export function syncSubscriptionStub(input: SyncSubscriptionInput): SyncSubscriptionResult {
  if (input.sandboxActive) {
    return {
      subscriptionStatus: 'active',
      productId: DEFAULT_SANDBOX_PRODUCT,
      synced: true,
    };
  }
  // Without a verified Play token we never elevate entitlement.
  return {
    subscriptionStatus: 'free',
    productId: null,
    synced: false,
  };
}
