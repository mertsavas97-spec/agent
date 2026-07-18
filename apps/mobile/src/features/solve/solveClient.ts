import { httpsCallable } from 'firebase/functions';

import type { SolveQuestionRequest, SolveQuestionResponse } from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

export async function callSolveQuestion(
  request: SolveQuestionRequest & { mimeType?: string },
): Promise<SolveQuestionResponse> {
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'solveQuestion');
  const result = await callable(request);
  return result.data as SolveQuestionResponse;
}
