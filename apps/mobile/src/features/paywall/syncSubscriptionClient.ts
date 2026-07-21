import { httpsCallable } from 'firebase/functions';

import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

import type { PlanId } from './pricing';
import { planById } from './pricing';
import { isPremiumSandboxEnv, writeEntitlementCache } from './entitlement';

export type SyncSubscriptionClientResult = {
  ok: boolean;
  reason?: string;
  productId?: string | null;
};

export async function callSyncSubscription(input: {
  productId: string;
  purchaseToken?: string;
  sandboxActive?: boolean;
}): Promise<SyncSubscriptionClientResult> {
  await ensureSignedIn();
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'syncSubscription');
  try {
    const result = await callable({
      productId: input.productId,
      purchaseToken: input.purchaseToken,
      sandboxActive: input.sandboxActive ?? false,
    });
    const data = result.data as {
      synced?: boolean;
      productId?: string | null;
      subscriptionStatus?: string;
    };
    if (!data?.synced) {
      return { ok: false, reason: 'not_synced', productId: data?.productId ?? null };
    }
    const planId = planIdFromProduct(data.productId ?? input.productId);
    await writeEntitlementCache({
      planId,
      productId: data.productId ?? input.productId,
      source: input.sandboxActive ? 'sandbox' : 'server',
    });
    return { ok: true, productId: data.productId ?? input.productId };
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : 'unknown';
    return { ok: false, reason: code };
  }
}

function planIdFromProduct(productId: string): PlanId {
  if (productId.includes('week')) return 'week';
  if (productId.includes('month')) return 'monthly';
  return 'yearly';
}

export async function syncSandboxPremium(planId: PlanId = 'yearly'): Promise<SyncSubscriptionClientResult> {
  if (!isPremiumSandboxEnv()) {
    return { ok: false, reason: 'sandbox_env_off' };
  }
  return callSyncSubscription({
    productId: planById(planId).productId,
    sandboxActive: true,
  });
}
