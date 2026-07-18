import { httpsCallable } from 'firebase/functions';

import type {
  ListAttemptsRequest,
  ListAttemptsResponse,
  ProgressSummary,
} from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

export async function fetchProgressSummary(): Promise<ProgressSummary> {
  if (process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1') {
    return {
      streakCount: 3,
      weakestTopic: null,
      topics: [],
      weekly: [],
    };
  }
  await ensureSignedIn();
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'getProgressSummary');
  const result = await callable({});
  return result.data as ProgressSummary;
}

export async function fetchAttempts(
  req: ListAttemptsRequest = {},
): Promise<ListAttemptsResponse> {
  if (process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1') {
    return {
      items: [
        {
          attemptId: 'demo-1',
          createdAt: new Date().toISOString(),
          subject: 'math',
          topicId: 'lgs-math-kesirler',
          status: 'solved',
          thumbnailUrl: null,
        },
      ],
      nextCursor: null,
    };
  }
  await ensureSignedIn();
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'listAttempts');
  const result = await callable(req);
  return result.data as ListAttemptsResponse;
}
