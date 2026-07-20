import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { isExamType } from '../theme/examTypes';
import type { ExamType } from '../types/contracts';

export async function updateExamTypeDocument(input: {
  uid: string;
  examType: string;
}): Promise<{ examType: ExamType }> {
  if (!isExamType(input.examType)) {
    const err = new Error('INVALID_EXAM');
    err.name = 'InvalidExamError';
    throw err;
  }
  const examType = input.examType;
  const ref = getFirestore().collection('users').doc(input.uid);
  await ref.set(
    {
      examType,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { examType };
}
