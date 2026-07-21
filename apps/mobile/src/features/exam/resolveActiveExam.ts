import { doc, getDoc } from 'firebase/firestore';

import type { ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

import { readExamPreference } from './examPreference';
import { isExamType } from './examTypes';

/**
 * Active exam package for solve / home.
 * Priority: explicit param → AsyncStorage preference → Firestore profile → default.
 * Preference wins over Firestore so UI selection (e.g. Trafik) is not lost when
 * Cloud rules/functions lag behind the catalog.
 */
export async function resolveActiveExamType(
  explicit?: string | null,
): Promise<{ examType: ExamType; source: 'param' | 'preference' | 'firestore' | 'default' }> {
  if (isExamType(explicit)) {
    return { examType: explicit, source: 'param' };
  }

  const preferred = await readExamPreference();
  if (preferred) {
    return { examType: preferred, source: 'preference' };
  }

  try {
    const user = await ensureSignedIn();
    const snap = await getDoc(doc(getFirebase().db, 'users', user.uid));
    const et = snap.data()?.examType;
    if (isExamType(et)) {
      return { examType: et, source: 'firestore' };
    }
  } catch {
    /* optional */
  }

  return { examType: 'lgs', source: 'default' };
}
