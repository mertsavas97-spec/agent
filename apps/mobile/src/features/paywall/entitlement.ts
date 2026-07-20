/**
 * Local Premium entitlement (MVP 1.0).
 * Play Billing doğrulaması gelene kadar AsyncStorage + sandbox.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { planById, type PlanId, PRICING } from './pricing';

const KEY = '@cozbil/premium_entitlement_v1';

export type EntitlementStatus = 'free' | 'active' | 'grace' | 'expired';

export type EntitlementSnapshot = {
  status: EntitlementStatus;
  source: 'stub' | 'sandbox' | 'local' | 'play';
  productId: string | null;
  planId: PlanId | null;
};

type Stored = {
  status: EntitlementStatus;
  planId: PlanId;
  productId: string;
  activatedAt: string;
};

let memory: Stored | null = null;

export async function hydrateEntitlement(): Promise<EntitlementSnapshot> {
  if (process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1') {
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
      source: 'local',
      productId: memory.productId,
      planId: memory.planId,
    };
  } catch {
    return { status: 'free', source: 'stub', productId: null, planId: null };
  }
}

export function readLocalEntitlement(): EntitlementSnapshot {
  if (process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1') {
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
      source: 'local',
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

export async function activateLocalPremium(planId: PlanId = 'yearly'): Promise<{
  ok: boolean;
  reason: 'local' | 'sandbox' | 'billing_not_configured';
  productId: string;
}> {
  const productId = planById(planId).productId;
  if (process.env.EXPO_PUBLIC_PREMIUM_SANDBOX === '1') {
    return { ok: true, reason: 'sandbox', productId };
  }
  const stored: Stored = {
    status: 'active',
    planId,
    productId,
    activatedAt: new Date().toISOString(),
  };
  memory = stored;
  await AsyncStorage.setItem(KEY, JSON.stringify(stored));
  return { ok: true, reason: 'local', productId };
}

export async function clearLocalPremium(): Promise<void> {
  memory = null;
  await AsyncStorage.removeItem(KEY);
}

/** @deprecated prefer activateLocalPremium — kept for solve.tsx imports */
export async function startPremiumPurchase(planId: PlanId = 'yearly'): Promise<{
  ok: boolean;
  reason: 'sandbox' | 'local' | 'billing_not_configured';
  productId: string;
}> {
  return activateLocalPremium(planId);
}
