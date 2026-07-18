import { createHash } from 'crypto';

/**
 * MVP image fingerprint for dedup.
 * Uses sampled average-hash over buffer bytes (good enough for identical/
 * near-identical re-uploads without native image libs).
 */
export function computePhash(buffer: Buffer): string {
  if (buffer.length === 0) return 'empty';

  const sampleSize = Math.min(256, buffer.length);
  const step = Math.max(1, Math.floor(buffer.length / sampleSize));
  const samples: number[] = [];
  for (let i = 0; i < buffer.length && samples.length < sampleSize; i += step) {
    samples.push(buffer[i]);
  }
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  const bits = samples.map((v) => (v >= avg ? '1' : '0')).join('');
  return createHash('sha256').update(bits).digest('hex').slice(0, 32);
}

export function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let dist = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) dist += 1;
  }
  return dist;
}

/** Exact fingerprint match for MVP cache key. */
export function cacheKeyFromPhash(phash: string, examType: string): string {
  return `${examType}_${phash}`;
}
