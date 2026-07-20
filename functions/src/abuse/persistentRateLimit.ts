/**
 * Firestore-backed sliding-window rate limit (multi-instance safe).
 * Complements in-memory assertRateLimit for same-instance bursts.
 */
import type { Firestore } from 'firebase-admin/firestore';

import { DEFAULT_SOLVE, type RateLimitConfig } from './rateLimit';

export type PersistentRateLimitDeps = {
  db: Firestore;
  now?: () => number;
};

function docIdForKey(key: string): string {
  return key.replace(/[/\\]/g, '_').slice(0, 700);
}

export async function assertPersistentRateLimit(
  key: string,
  deps: PersistentRateLimitDeps,
  config: RateLimitConfig = DEFAULT_SOLVE,
): Promise<void> {
  const now = deps.now?.() ?? Date.now();
  const ref = deps.db.collection('rateLimits').doc(docIdForKey(key));

  await deps.db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? (snap.data()?.timestamps as number[] | undefined) : undefined;
    const windowStart = now - config.windowMs;
    const timestamps = (Array.isArray(prev) ? prev : []).filter((t) => t > windowStart);

    if (timestamps.length >= config.maxCalls) {
      const err = new Error('RATE_LIMIT');
      err.name = 'RateLimitError';
      throw err;
    }

    timestamps.push(now);
    tx.set(
      ref,
      {
        key,
        timestamps,
        updatedAt: now,
      },
      { merge: true },
    );
  });
}

/** In-memory fake for unit tests (no Admin SDK). */
export function createMemoryPersistentRateLimit() {
  const buckets = new Map<string, number[]>();
  return {
    async assert(
      key: string,
      config: RateLimitConfig = DEFAULT_SOLVE,
      now = Date.now(),
    ): Promise<void> {
      const windowStart = now - config.windowMs;
      const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);
      if (timestamps.length >= config.maxCalls) {
        const err = new Error('RATE_LIMIT');
        err.name = 'RateLimitError';
        throw err;
      }
      timestamps.push(now);
      buckets.set(key, timestamps);
    },
    __reset() {
      buckets.clear();
    },
  };
}
