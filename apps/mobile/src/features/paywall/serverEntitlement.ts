/**
 * Read Premium entitlement from users/{uid} (server source of truth).
 */

import { doc, getDoc } from 'firebase/firestore';

import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase, isFirebaseConfigured } from '@/src/lib/firebase';

import type { EntitlementSnapshot, EntitlementStatus } from './entitlement';
import type { PlanId } from './pricing';

function planIdFromProduct(productId: string | null): PlanId | null {
  if (!productId) return null;
  if (productId.includes('week')) return 'week';
  if (productId.includes('month')) return 'monthly';
  if (productId.includes('year')) return 'yearly';
  return 'yearly';
}

function asStatus(raw: unknown): EntitlementStatus {
  if (raw === 'active' || raw === 'grace' || raw === 'expired' || raw === 'free') {
    return raw;
  }
  return 'free';
}

/** Returns null when Firebase is not configured or read fails. */
export async function fetchServerEntitlement(): Promise<EntitlementSnapshot | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const user = await ensureSignedIn();
    const { db } = getFirebase();
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const status = asStatus(data.subscriptionStatus);
    const productId =
      typeof data.subscriptionProductId === 'string' ? data.subscriptionProductId : null;
    return {
      status,
      source: 'server',
      productId,
      planId: planIdFromProduct(productId),
    };
  } catch {
    return null;
  }
}
