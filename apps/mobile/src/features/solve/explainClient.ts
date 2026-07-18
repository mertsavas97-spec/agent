import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/src/lib/firebase';

export async function callExplainAgain(solutionId: string): Promise<string> {
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'explainAgain');
  const result = await callable({ solutionId });
  const data = result.data as { explanation?: string };
  if (!data.explanation) throw new Error('empty explanation');
  return data.explanation;
}
