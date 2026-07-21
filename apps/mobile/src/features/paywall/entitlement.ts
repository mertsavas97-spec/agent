/**
 * Local Premium entitlement (MVP 1.0).
 * Production: Play Billing → syncSubscription callable.
 * Local activate only in __DEV__ or EXPO_PUBLIC_PREMIUM_SANDBOX=1.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { planById, type PlanId, PRICING } from './pricing';

const KEY = '@cozbil/premium_entitlement_v1';

export type EntitlementStatus = 'free' | 'active' | 'grace' | 'expired';

export type EntitlementSnapshot = {
  status: EntitlementStatus;
  source: 'stub' | 'sandbox' | 'local' | 'play' | 'server';
  productId: string | null;
  planId: PlanId | null;
};

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

export async function hydrateEntitlement(): Promise<EntitlementSnapshot> {
  if (isPremiumSandboxEnv()) {
    return {
      status: 'active',
      source: 'sandbox',
      productId: PRICING.monthly.productId,
      planId: 'monthly',
    };
  }
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      memory = null;
      return { status: 'free', source: 'stub', productId: null, planId: null };
    }
    memory = JSON.parse(raw) as Stored;
    return {
      status: memory.status,
      source: memory.source ?? 'local',
      productId: memory.productId,
      planId: memory.planId,
    };
  } catch {
    return { status: 'free', source: 'stub', productId: null, planId: null };
  }
}

export function readLocalEntitlement(): EntitlementSnapshot {
  if (isPremiumSandboxEnv()) {
    return {
      status: 'active',
      source: 'sandbox',
      productId: PRICING.monthly.productId,
      planId: 'monthly',
    };
  }
  if (memory?.status === 'active') {
    return {
      status: 'active',
      source: memory.source ?? 'local',
      productId: memory.productId,
      planId: memory.planId,
    };
  }
  return { status: 'free', source: 'stub', productId: null, planId: null };
}

export function isPremiumActive(snap?: EntitlementSnapshot): boolean {
  const s = snap ?? readLocalEntitlement();
  return s.status === 'active' || s.status === 'grace';
}

export async function writeEntitlementCache(input: {
  planId: PlanId;
  productId: string;
  source: EntitlementSnapshot['source'];
  status?: EntitlementStatus;
}): Promise<EntitlementSnapshot> {
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
