/**
 * US7 — simple sliding-window rate limit (in-memory per instance).
 * Production: move counters to Firestore/Redis for multi-instance fairness.
 */

export type RateLimitConfig = {
  maxCalls: number;
  windowMs: number;
};

const DEFAULT_SOLVE: RateLimitConfig = { maxCalls: 20, windowMs: 60 * 60 * 1000 };

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function assertRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_SOLVE,
  now = Date.now(),
): void {
  const bucket = buckets.get(key) ?? { timestamps: [] };
  const windowStart = now - config.windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
  if (bucket.timestamps.length >= config.maxCalls) {
    const err = new Error('RATE_LIMIT');
    err.name = 'RateLimitError';
    throw err;
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
}

export function __resetRateLimitBucketsForTests(): void {
  buckets.clear();
}

export { DEFAULT_SOLVE };
