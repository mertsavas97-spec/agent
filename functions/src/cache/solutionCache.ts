import type { SolutionStep, Subject } from '../types/contracts';
import { cacheKeyFromPhash } from './phash';

export type CachedSolution = {
  phash: string;
  topicId: string | null;
  steps: SolutionStep[];
  subject: Subject;
};

export type CacheStore = {
  get(key: string): Promise<CachedSolution | null>;
  set(key: string, value: CachedSolution): Promise<void>;
};

export function makeMemoryCache(): CacheStore {
  const map = new Map<string, CachedSolution>();
  return {
    async get(key) {
      return map.get(key) ?? null;
    },
    async set(key, value) {
      map.set(key, value);
    },
  };
}

export async function lookupCache(
  store: CacheStore,
  phash: string,
  examType: string,
): Promise<CachedSolution | null> {
  return store.get(cacheKeyFromPhash(phash, examType));
}

export async function writeCache(
  store: CacheStore,
  phash: string,
  examType: string,
  value: CachedSolution,
): Promise<void> {
  await store.set(cacheKeyFromPhash(phash, examType), value);
}
