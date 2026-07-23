/**
 * Play Billing / StoreKit purchase via expo-iap (Expo path for OpenIAP).
 * Falls back to local/dev activate when canUseLocalPremium().
 */

import { Platform } from 'react-native';

import {
  activateLocalPremium,
  canUseLocalPremium,
  isPremiumSandboxEnv,
  type EntitlementSnapshot,
} from './entitlement';
import { planById, type PlanId, PLANS } from './pricing';
import { callSyncSubscription } from './syncSubscriptionClient';

export type PurchasePremiumResult = {
  ok: boolean;
  reason:
    | 'play'
    | 'local'
    | 'sandbox'
    | 'user_cancelled'
    | 'billing_unavailable'
    | 'sync_failed'
    | 'billing_not_configured'
    | 'credentials_missing'
    | 'ios_not_implemented';
  productId: string;
};

/** User-facing copy for failed purchase / restore (no overclaim). */
export function billingFailureMessage(reason?: string | null): string {
  switch (reason) {
    case 'credentials_missing':
    case 'failed-precondition':
      return Platform.OS === 'ios'
        ? 'App Store doğrulaması sunucuda yapılandırılmamış. iOS satın alma doğrulaması tamamlanana kadar Premium yükseltmesi bitmez.'
        : 'Satın alma doğrulaması sunucuda yapılandırılmamış. Play Billing credential eklenene kadar Premium yükseltmesi tamamlanamaz.';
    case 'ios_not_implemented':
    case 'unimplemented':
      return 'App Store satın alma doğrulaması sunucuda tamamlanamadı. Functions Apple API anahtarlarını kontrol et.';
    case 'billing_not_configured':
    case 'billing_unavailable':
      return 'Mağaza faturalaması bu derlemede kullanılamıyor. Prod’da mağaza ürünleri + syncSubscription gerekir.';
    case 'none':
      return 'Geri yüklenecek satın alma bulunamadı.';
    case 'user_cancelled':
      return 'Satın alma iptal edildi.';
    case 'sync_failed':
      return 'Satın alma sunucuda doğrulanamadı. İnternet ve mağaza hesabını kontrol edip tekrar dene.';
    default:
      return 'İşlem tamamlanamadı. Biraz sonra tekrar dene.';
  }
}

const SUB_SKUS = PLANS.map((p) => p.productId);

type ExpoIapModule = {
  initConnection: () => Promise<boolean>;
  endConnection: () => Promise<void>;
  fetchProducts: (args: { skus: string[]; type: 'subs' }) => Promise<unknown>;
  requestPurchase: (args: {
    request: { apple: { sku: string }; google: { skus: string[] } };
    type: 'subs';
  }) => Promise<PurchaseLike | PurchaseLike[] | void>;
  finishTransaction: (args: {
    purchase: PurchaseLike;
    isConsumable?: boolean;
  }) => Promise<void>;
  getAvailablePurchases: () => Promise<PurchaseLike[]>;
};

type PurchaseLike = {
  productId?: string;
  purchaseToken?: string;
  /** StoreKit / OpenIAP transaction id fallback when purchaseToken absent */
  id?: string;
  transactionId?: string;
};

function resolvePurchaseProof(purchase: PurchaseLike): string | null {
  const token =
    purchase.purchaseToken?.trim() ||
    purchase.transactionId?.trim() ||
    purchase.id?.trim() ||
    '';
  return token.length >= 6 ? token : null;
}

async function loadIap(): Promise<ExpoIapModule | null> {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-iap') as ExpoIapModule;
  } catch {
    return null;
  }
}

function pickPurchase(
  result: PurchaseLike | PurchaseLike[] | void,
  productId: string,
): PurchaseLike | null {
  if (!result) return null;
  const list = Array.isArray(result) ? result : [result];
  return (
    list.find((p) => p.productId === productId) ??
    list.find((p) => Boolean(p.purchaseToken)) ??
    null
  );
}

/**
 * Start Premium: IAP → server sync; or local/sandbox when allowed.
 */
export async function purchasePremiumPlan(
  planId: PlanId = 'yearly',
): Promise<PurchasePremiumResult> {
  const productId = planById(planId).productId;

  if (isPremiumSandboxEnv()) {
    const sync = await callSyncSubscription({
      productId,
      sandboxActive: true,
    });
    if (sync.ok) {
      return { ok: true, reason: 'sandbox', productId };
    }
    // Server sandbox may be off — still allow local sandbox UX
    const local = await activateLocalPremium(planId);
    return {
      ok: local.ok,
      reason: local.ok ? 'sandbox' : 'billing_not_configured',
      productId,
    };
  }

  const iap = await loadIap();
  if (!iap) {
    if (canUseLocalPremium()) {
      const local = await activateLocalPremium(planId);
      return {
        ok: local.ok,
        reason: local.ok ? 'local' : 'billing_not_configured',
        productId,
      };
    }
    return { ok: false, reason: 'billing_unavailable', productId };
  }

  try {
    await iap.initConnection();
    await iap.fetchProducts({ skus: SUB_SKUS, type: 'subs' });
    const purchased = await iap.requestPurchase({
      request: {
        apple: { sku: productId },
        google: { skus: [productId] },
      },
      type: 'subs',
    });
    const purchase = pickPurchase(purchased, productId);
    const proof = purchase ? resolvePurchaseProof(purchase) : null;
    if (!purchase || !proof) {
      // Some stores deliver via listener only — treat as unavailable for sync
      if (canUseLocalPremium()) {
        const local = await activateLocalPremium(planId);
        return {
          ok: local.ok,
          reason: local.ok ? 'local' : 'sync_failed',
          productId,
        };
      }
      return { ok: false, reason: 'sync_failed', productId };
    }

    const sync = await callSyncSubscription({
      productId: purchase.productId ?? productId,
      purchaseToken: proof,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    if (!sync.ok) {
      const reason =
        sync.reason === 'credentials_missing' ||
        sync.reason === 'failed-precondition' ||
        /credentials_missing|failed-precondition/i.test(sync.reason ?? '')
          ? 'credentials_missing'
          : sync.reason === 'ios_not_implemented' || sync.reason === 'unimplemented'
            ? 'ios_not_implemented'
            : 'sync_failed';
      return { ok: false, reason, productId };
    }

    try {
      await iap.finishTransaction({ purchase, isConsumable: false });
    } catch {
      // non-fatal after server grant
    }

    return { ok: true, reason: 'play', productId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(msg) || /user-cancelled/i.test(msg)) {
      return { ok: false, reason: 'user_cancelled', productId };
    }
    if (canUseLocalPremium()) {
      const local = await activateLocalPremium(planId);
      return {
        ok: local.ok,
        reason: local.ok ? 'local' : 'billing_unavailable',
        productId,
      };
    }
    return { ok: false, reason: 'billing_unavailable', productId };
  } finally {
    try {
      const mod = await loadIap();
      await mod?.endConnection();
    } catch {
      // ignore
    }
  }
}

export async function restorePremiumPurchases(): Promise<{
  ok: boolean;
  snapHint?: EntitlementSnapshot['status'];
  reason?: string;
}> {
  if (isPremiumSandboxEnv() || canUseLocalPremium()) {
    const { hydrateEntitlement } = await import('./entitlement');
    const snap = await hydrateEntitlement();
    return { ok: snap.status === 'active', snapHint: snap.status };
  }

  const iap = await loadIap();
  if (!iap) {
    return { ok: false, reason: 'billing_unavailable' };
  }

  try {
    await iap.initConnection();
    const purchases = await iap.getAvailablePurchases();
    const match = purchases.find((p) => {
      if (!p.productId || !SUB_SKUS.includes(p.productId)) return false;
      return Boolean(resolvePurchaseProof(p));
    });
    const proof = match ? resolvePurchaseProof(match) : null;
    if (!match?.productId || !proof) {
      return { ok: false, reason: 'none' };
    }
    const sync = await callSyncSubscription({
      productId: match.productId,
      purchaseToken: proof,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    if (sync.ok) return { ok: true, reason: 'restored' };
    if (
      sync.reason === 'credentials_missing' ||
      sync.reason === 'failed-precondition' ||
      /credentials_missing|failed-precondition/i.test(sync.reason ?? '')
    ) {
      return { ok: false, reason: 'credentials_missing' };
    }
    if (
      sync.reason === 'ios_not_implemented' ||
      sync.reason === 'unimplemented'
    ) {
      return { ok: false, reason: 'ios_not_implemented' };
    }
    return { ok: false, reason: sync.reason ?? 'sync_failed' };
  } catch {
    return { ok: false, reason: 'billing_unavailable' };
  } finally {
    try {
      await iap.endConnection();
    } catch {
      // ignore
    }
  }
}
