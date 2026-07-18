import { httpsCallable } from 'firebase/functions';

import { updateExamTypeLocal } from '@/src/features/auth/userDocLocal';
import type { ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

export async function callUpdateExamType(examType: ExamType): Promise<ExamType> {
  const user = await ensureSignedIn();
  const { functions } = getFirebase();
  try {
    const callable = httpsCallable(functions, 'updateExamType');
    const result = await callable({ examType });
    const data = result.data as { examType?: ExamType };
    if (data.examType !== 'lgs' && data.examType !== 'ygs' && data.examType !== 'kpss') {
      throw new Error('INVALID_EXAM_RESPONSE');
    }
    return data.examType;
  } catch {
    // updateExamType may be undeployed and/or Functions IAM blocked — Firestore fallback.
    return updateExamTypeLocal(user.uid, examType);
  }
}
