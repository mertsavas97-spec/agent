import { httpsCallable } from 'firebase/functions';

import type { ExamType } from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

export async function callUpdateExamType(examType: ExamType): Promise<ExamType> {
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'updateExamType');
  const result = await callable({ examType });
  const data = result.data as { examType?: ExamType };
  if (data.examType !== 'lgs' && data.examType !== 'ygs' && data.examType !== 'kpss') {
    throw new Error('INVALID_EXAM_RESPONSE');
  }
  return data.examType;
}
