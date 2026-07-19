import { httpsCallable } from 'firebase/functions';

import type { SolveQuestionRequest, SolveQuestionResponse } from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

import { callSolveQuestionViaFirestore } from './solveViaFirestore';

function isInvokerBlocked(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err && typeof (err as { code: unknown }).code === 'string'
    ? (err as { code: string }).code
    : '';
  const message = err instanceof Error ? err.message : '';
  return (
    code === 'functions/permission-denied' ||
    code === 'functions/unauthenticated' ||
    /403|Forbidden|permission-denied|not.?found/i.test(`${code} ${message}`)
  );
}

/**
 * Prefer Storage/Firestore trigger path (works under Domain Restricted Sharing).
 * `requestId` must match the upload filename stem.
 */
export async function callSolveQuestion(
  request: SolveQuestionRequest & { mimeType?: string; requestId: string },
): Promise<SolveQuestionResponse> {
  try {
    return await callSolveQuestionViaFirestore(request);
  } catch (firestoreErr) {
    console.warn('solveViaFirestore failed, trying callable', firestoreErr);

    const fsCode =
      firestoreErr &&
      typeof firestoreErr === 'object' &&
      'code' in firestoreErr &&
      typeof (firestoreErr as { code: unknown }).code === 'string'
        ? (firestoreErr as { code: string }).code
        : '';

    if (fsCode === 'permission-denied') {
      throw Object.assign(
        new Error(
          'Firestore izin yok (solveRequests). Mac’te: bash scripts/deploy-firestore-solve.sh',
        ),
        { code: 'functions/permission-denied' },
      );
    }

    try {
      const { functions } = getFirebase();
      const callable = httpsCallable(functions, 'solveQuestion');
      const { requestId: _requestId, ...callablePayload } = request;
      const result = await callable(callablePayload);
      return result.data as SolveQuestionResponse;
    } catch (callableErr) {
      if (isInvokerBlocked(callableErr)) {
        throw Object.assign(
          new Error(
            'Callable 403 + trigger solve başarısız. Mac’te: bash scripts/deploy-firestore-solve.sh (onSolveUploadFinalized)',
          ),
          { code: 'functions/permission-denied' },
        );
      }
      throw callableErr;
    }
  }
}
