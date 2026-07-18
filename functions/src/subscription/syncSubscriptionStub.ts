/**
 * Play Billing entitlement sync stub (US6 / T051).
 *
 * Real integration (documented in specs/002-cozbil-mvp/quickstart.md):
 * - Verify purchase token with Google Play Developer API
 * - Upsert users/{uid}.subscriptionStatus + subscriptionExpiresAt
 * - Return entitlement snapshot for the client
 *
 * This stub accepts a sandbox flag for emulator dogfood only.
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
