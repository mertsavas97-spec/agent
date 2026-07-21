import { readLocalEntitlement } from '@/src/features/paywall/entitlement';

/** Premium = any paid plan / sandbox active — all ad formats off. */
export function isPremiumAudience(): boolean {
  const ent = readLocalEntitlement();
  return ent.status === 'active' || ent.status === 'grace';
}
