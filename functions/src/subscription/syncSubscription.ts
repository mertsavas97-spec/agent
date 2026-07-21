/**
 * Sync Play / sandbox entitlement → decision + Firestore persist.
 */

import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import type { QuotaState } from '../quota/dailyQuota';
import {
  isAllowedProductId,
  verifyPlayPurchase,
  type VerifyPlayResult,
} from './verifyPlayPurchase';

export type SyncSubscriptionInput = {
  uid: string;
  productId?: string;
  purchaseToken?: string;
  /** Dogfood only — requires COZBIL_BILLING_SANDBOX=1 on Functions */
  sandboxActive?: boolean;
};

export type SyncSubscriptionResult = {
  subscriptionStatus: QuotaState['subscriptionStatus'];
  productId: string | null;
  synced: boolean;
  expiresAt: string | null;
  reason?:
    | 'ok'
    | 'sandbox'
    | 'missing_token'
    | 'invalid_product'
    | 'credentials_missing'
    | 'verify_failed'
    | 'sandbox_disabled';
};

const DEFAULT_SANDBOX_PRODUCT = 'cozbil_premium_yearly';

export type VerifyFn = (input: {
  productId: string;
  purchaseToken: string;
}) => Promise<VerifyPlayResult>;

export function billingSandboxEnabled(): boolean {
  return process.env.COZBIL_BILLING_SANDBOX === '1';
}

/** Pure sync decision (testable). */
export async function syncSubscriptionDecision(
  input: SyncSubscriptionInput,
  verify: VerifyFn = verifyPlayPurchase,
): Promise<SyncSubscriptionResult> {
  if (input.sandboxActive) {
    if (!billingSandboxEnabled()) {
      return {
        subscriptionStatus: 'free',
        productId: null,
        synced: false,
        expiresAt: null,
        reason: 'sandbox_disabled',
      };
    }
    const productId =
      input.productId && isAllowedProductId(input.productId)
        ? input.productId
        : DEFAULT_SANDBOX_PRODUCT;
    return {
      subscriptionStatus: 'active',
      productId,
      synced: true,
      expiresAt: null,
      reason: 'sandbox',
    };
  }

  const productId = input.productId?.trim() ?? '';
  const purchaseToken = input.purchaseToken?.trim() ?? '';

  if (!purchaseToken) {
    return {
      subscriptionStatus: 'free',
      productId: null,
      synced: false,
      expiresAt: null,
      reason: 'missing_token',
    };
  }
  if (!isAllowedProductId(productId)) {
    return {
      subscriptionStatus: 'free',
      productId: null,
      synced: false,
      expiresAt: null,
      reason: 'invalid_product',
    };
  }

  const verified = await verify({ productId, purchaseToken });
  if (!verified.ok) {
    return {
      subscriptionStatus: 'free',
      productId: null,
      synced: false,
      expiresAt: null,
      reason:
        verified.reason === 'credentials_missing'
          ? 'credentials_missing'
          : 'verify_failed',
    };
  }

  return {
    subscriptionStatus: 'active',
    productId,
    synced: true,
    expiresAt: verified.expiresAt,
    reason: 'ok',
  };
}

/** Persist entitlement on users/{uid}. */
export async function persistSubscription(
  uid: string,
  result: SyncSubscriptionResult,
): Promise<void> {
  const ref = getFirestore().collection('users').doc(uid);
  await ref.set(
    {
      subscriptionStatus: result.subscriptionStatus,
      subscriptionProductId: result.productId,
      subscriptionExpiresAt: result.expiresAt,
      subscriptionSyncedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function syncSubscriptionForUser(
  input: SyncSubscriptionInput,
  verify: VerifyFn = verifyPlayPurchase,
): Promise<SyncSubscriptionResult> {
  const decision = await syncSubscriptionDecision(input, verify);
  if (decision.synced) {
    await persistSubscription(input.uid, decision);
  }
  return decision;
}
