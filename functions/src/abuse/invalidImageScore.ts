/**
 * US7 — accumulate invalid/moderation rejects; soft-restrict when threshold hit.
 */

export const INVALID_RESTRICT_THRESHOLD = 8;

export type RestrictionState = {
  invalidImageScore: number;
  restrictedUntil: number | null;
};

export function nextInvalidScore(prev: number, rejected: boolean): number {
  if (!rejected) return Math.max(0, prev - 1);
  return prev + 1;
}

export function isTemporarilyRestricted(state: RestrictionState, now = Date.now()): boolean {
  return state.restrictedUntil != null && state.restrictedUntil > now;
}

export function restrictionAfterScore(
  score: number,
  now = Date.now(),
): RestrictionState {
  if (score >= INVALID_RESTRICT_THRESHOLD) {
    return {
      invalidImageScore: score,
      restrictedUntil: now + 30 * 60 * 1000,
    };
  }
  return { invalidImageScore: score, restrictedUntil: null };
}
