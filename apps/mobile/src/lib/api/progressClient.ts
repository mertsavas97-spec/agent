import { httpsCallable } from 'firebase/functions';

import type {
  ListAttemptsRequest,
  ListAttemptsResponse,
  ProgressSummary,
} from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

export async function fetchProgressSummary(): Promise<ProgressSummary> {
  await ensureSignedIn();
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'getProgressSummary');
  const result = await callable({});
  return result.data as ProgressSummary;
}

export async function fetchAttempts(
  req: ListAttemptsRequest = {},
): Promise<ListAttemptsResponse> {
  await ensureSignedIn();
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'listAttempts');
  const result = await callable(req);
  return result.data as ListAttemptsResponse;
}
