import type { ExamType } from '@/src/lib/api/types';

import { readExamPreference } from './examPreference';

let cached: ExamType | null | undefined;

/** In-memory cache — avoids AsyncStorage read on every tab focus. */
export function peekExamPreferenceCache(): ExamType | null {
  return cached ?? null;
}

export function setExamPreferenceCache(examType: ExamType | null): void {
  cached = examType;
}

export async function loadExamPreferenceCached(): Promise<ExamType | null> {
  if (cached !== undefined) return cached;
  cached = await readExamPreference();
  return cached;
}

export function invalidateExamPreferenceCache(): void {
  cached = undefined;
}
