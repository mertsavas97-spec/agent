import { httpsCallable } from 'firebase/functions';

import { updateExamTypeLocal } from '@/src/features/auth/userDocLocal';
import type { ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

import { writeExamPreference } from './examPreference';
import { isExamType } from './examTypes';

/**
 * Persist exam package (LGS / YGS / KPSS / Trafik).
 * Always writes local preference first so UI stays on the selected package even when
 * Cloud Functions / Firestore rules lag behind the catalog (e.g. new Trafik package).
 */
export async function callUpdateExamType(examType: ExamType): Promise<ExamType> {
  if (!isExamType(examType)) {
    throw new Error('INVALID_EXAM');
  }

  await writeExamPreference(examType);

  const user = await ensureSignedIn();
  const { functions } = getFirebase();

  try {
    const callable = httpsCallable(functions, 'updateExamType');
    const result = await callable({ examType });
    const data = result.data as { examType?: unknown };
    if (isExamType(data.examType)) {
      return data.examType;
    }
  } catch {
    // undeployed / old allow-list / IAM
  }

  try {
    return await updateExamTypeLocal(user.uid, examType);
  } catch {
    // Rules may still reject new packages — preference already saved; keep selection.
    return examType;
  }
}
