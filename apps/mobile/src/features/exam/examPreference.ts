import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ExamType } from '@/src/lib/api/types';

import { isExamType } from './examTypes';

const KEY = '@cozbil/examType';

/** Last selected exam package — survives when Cloud/Firestore lag behind catalog. */
export async function readExamPreference(): Promise<ExamType | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return isExamType(raw) ? raw : null;
  } catch {
    return null;
  }
}

export async function writeExamPreference(examType: ExamType): Promise<void> {
  if (!isExamType(examType)) return;
  try {
    await AsyncStorage.setItem(KEY, examType);
    const { setExamPreferenceCache } = await import('./examPreferenceCache');
    setExamPreferenceCache(examType);
  } catch {
    // non-fatal
  }
}
