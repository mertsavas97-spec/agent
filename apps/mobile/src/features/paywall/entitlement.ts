/**
 * Premium entitlement — local cache + server hydrate from users/{uid}.
 * Production: Play Billing → syncSubscription callable → Firestore.
 * Local activate only in __DEV__ or EXPO_PUBLIC_PREMIUM_SANDBOX=1.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  hydrateDemoForceFree,
  isDemoForceFree,
  setDemoForceFree,
} from './demoForceFree';
import { planById, type PlanId, PRICING } from './pricing';
import { fetchServerEntitlement } from './serverEntitlement';

const KEY = '@cozbil/premium_entitlement_v1';

export type EntitlementStatus = 'free' | 'active' | 'grace' | 'expired';

export type EntitlementSnapshot = {
  status: EntitlementStatus;
  source: 'stub' | 'sandbox' | 'local' | 'play' | 'server';
  productId: string | null;
  planId: PlanId | null;
};

const FREE_SNAP = (): EntitlementSnapshot => ({
  status: 'free',
  source: 'stub',
  productId: null,
  planId: null,
});

type Stored = {
  status: EntitlementStatus;
  planId: PlanId;
  productId: string;
  activatedAt: string;
  source?: EntitlementSnapshot['source'];
};

let memory: Stored | null = null;

export function isPremiumSandboxEnv(): boolean {
  return process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1';
}

/** Local/dev bypass — never in production release builds. */
export function canUseLocalPremium(): boolean {
  if (isPremiumSandboxEnv()) return true;
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

async function readLocalCache(): Promise<EntitlementSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      memory = null;
      return FREE_SNAP();
    }
    memory = JSON.parse(raw) as Stored;
    return {
      status: memory.status,
      source: memory.source ?? 'local',
      productId: memory.productId,
      planId: memory.planId,
    };
  } catch {
    return FREE_SNAP();
  }
}

/**
 * Hydrate entitlement: demo/sandbox overrides → server users/{uid} → local cache.
 * Server active/grace wins over stale local free; server free clears play/server cache
 * (local/dev activate kept when canUseLocalPremium).
 */
export async function hydrateEntitlement(): Promise<EntitlementSnapshot> {
  await hydrateDemoForceFree();
  if (isDemoForceFree()) {
    return FREE_SNAP();
  }
  if (isPremiumSandboxEnv()) {
    return {
      status: 'active',
      source: 'sandbox',
      productId: PRICING.monthly.productId,
      planId: 'monthly',
    };
  }

  const local = await readLocalCache();
  const server = await fetchServerEntitlement();

  if (server && (server.status === 'active' || server.status === 'grace')) {
    if (server.planId && server.productId) {
      await writeEntitlementCache({
        planId: server.planId,
        productId: server.productId,
        source: 'server',
        status: server.status,
      });
    }
    return {
      status: server.status,
      source: 'server',
      productId: server.productId,
      planId: server.planId,
    };
  }

  if (
    server &&
    server.status === 'free' &&
    (local.source === 'server' || local.source === 'play') &&
    (local.status === 'active' || local.status === 'grace')
  ) {
    await clearLocalPremium();
    return FREE_SNAP();
  }

  return local;
}

export function readLocalEntitlement(): EntitlementSnapshot {
  if (isDemoForceFree()) {
    return FREE_SNAP();
  }
  if (isPremiumSandboxEnv()) {
    return {
      status: 'active',
      source: 'sandbox',
      productId: PRICING.monthly.productId,
      planId: 'monthly',
    };
  }
  if (memory?.status === 'active' || memory?.status === 'grace') {
    return {
      status: memory.status,
      source: memory.source ?? 'local',
      productId: memory.productId,
      planId: memory.planId,
    };
  }
  return FREE_SNAP();
}

export function isPremiumActive(snap?: EntitlementSnapshot): boolean {
  if (isDemoForceFree()) return false;
  const s = snap ?? readLocalEntitlement();
  return s.status === 'active' || s.status === 'grace';
}

export async function writeEntitlementCache(input: {
  planId: PlanId;
  productId: string;
  source: EntitlementSnapshot['source'];
  status?: EntitlementStatus;
}): Promise<EntitlementSnapshot> {
  // Activating Premium exits demo free override.
  if (isDemoForceFree()) {
    await setDemoForceFree(false);
  }
  const stored: Stored = {
    status: input.status ?? 'active',
    planId: input.planId,
    productId: input.productId,
    activatedAt: new Date().toISOString(),
    source: input.source,
  };
  memory = stored;
  await AsyncStorage.setItem(KEY, JSON.stringify(stored));
  return {
    status: stored.status,
    source: input.source,
    productId: stored.productId,
    planId: stored.planId,
  };
}

export async function activateLocalPremium(planId: PlanId = 'yearly'): Promise<{
  ok: boolean;
  reason: 'local' | 'sandbox' | 'billing_not_configured';
  productId: string;
}> {
  const productId = planById(planId).productId;
  if (isPremiumSandboxEnv()) {
    await writeEntitlementCache({ planId, productId, source: 'sandbox' });
    return { ok: true, reason: 'sandbox', productId };
  }
  if (!canUseLocalPremium()) {
    return { ok: false, reason: 'billing_not_configured', productId };
  }
  await writeEntitlementCache({ planId, productId, source: 'local' });
  return { ok: true, reason: 'local', productId };
}

export async function clearLocalPremium(): Promise<void> {
  memory = null;
  await AsyncStorage.removeItem(KEY);
}

/** @deprecated prefer purchasePremiumPlan — kept for solve.tsx imports */
export async function startPremiumPurchase(planId: PlanId = 'yearly'): Promise<{
  ok: boolean;
  reason: 'sandbox' | 'local' | 'billing_not_configured';
  productId: string;
}> {
  return activateLocalPremium(planId);
}
