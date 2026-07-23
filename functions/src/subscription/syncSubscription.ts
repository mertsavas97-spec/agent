/**
 * Sync Play / App Store / sandbox entitlement → decision + Firestore persist.
 */

import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import type { QuotaState } from '../quota/dailyQuota';
import {
  appStoreCredentialsConfigured,
  verifyAppStorePurchase,
  type VerifyAppStoreResult,
} from './verifyAppStorePurchase';
import {
  isAllowedProductId,
  verifyPlayPurchase,
  type VerifyPlayResult,
} from './verifyPlayPurchase';

export type BillingPlatform = 'android' | 'ios';

export type SyncSubscriptionInput = {
  uid: string;
  productId?: string;
  purchaseToken?: string;
  /** android (Play) default; ios uses StoreKit verify stub */
  platform?: BillingPlatform;
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
    | 'sandbox_disabled'
    | 'ios_not_implemented';
};

const DEFAULT_SANDBOX_PRODUCT = 'cozbil_premium_yearly';

export type VerifyPlayFn = (input: {
  productId: string;
  purchaseToken: string;
}) => Promise<VerifyPlayResult>;

export type VerifyAppStoreFn = (input: {
  productId: string;
  transactionId: string;
}) => Promise<VerifyAppStoreResult>;

export function billingSandboxEnabled(): boolean {
  return process.env.COZBIL_BILLING_SANDBOX === '1';
}

function resolvePlatform(input: SyncSubscriptionInput): BillingPlatform {
  return input.platform === 'ios' ? 'ios' : 'android';
}

/** Pure sync decision (testable). */
export async function syncSubscriptionDecision(
  input: SyncSubscriptionInput,
  verifyPlay: VerifyPlayFn = verifyPlayPurchase,
  verifyIos: VerifyAppStoreFn = verifyAppStorePurchase,
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
  const platform = resolvePlatform(input);

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

  if (platform === 'ios') {
    const verified = await verifyIos({ productId, transactionId: purchaseToken });
    if (!verified.ok) {
      return {
        subscriptionStatus: 'free',
        productId: null,
        synced: false,
        expiresAt: null,
        reason:
          verified.reason === 'credentials_missing'
            ? 'credentials_missing'
            : verified.reason === 'not_implemented'
              ? 'ios_not_implemented'
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

  const verified = await verifyPlay({ productId, purchaseToken });
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
  verifyPlay: VerifyPlayFn = verifyPlayPurchase,
  verifyIos: VerifyAppStoreFn = verifyAppStorePurchase,
): Promise<SyncSubscriptionResult> {
  const decision = await syncSubscriptionDecision(input, verifyPlay, verifyIos);
  if (decision.synced) {
    await persistSubscription(input.uid, decision);
  }
  return decision;
}

export { appStoreCredentialsConfigured };
