import { httpsCallable } from 'firebase/functions';

import type { SolveQuestionRequest, SolveQuestionResponse } from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

import {
  buildLocalSolveFallback,
  isServerSolveUnavailable,
} from './localSolveFallback';
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
 * 1) Firestore/Storage trigger path (org-policy safe)
 * 2) Callable solveQuestion (often 403 under Domain Restricted Sharing)
 * 3) Local dogfood fallback — always returns a usable solution when server is blocked
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
      console.warn('Firestore create denied — using local fallback');
      return buildLocalSolveFallback({
        examType: request.examType,
        subjectHint: request.subjectHint,
        requestId: request.requestId,
      });
    }

    try {
      const { functions } = getFirebase();
      const callable = httpsCallable(functions, 'solveQuestion');
      const { requestId: _requestId, ...callablePayload } = request;
      const result = await callable(callablePayload);
      return result.data as SolveQuestionResponse;
    } catch (callableErr) {
      if (isInvokerBlocked(callableErr) || isServerSolveUnavailable(firestoreErr)) {
        console.warn(
          'Server solve unavailable (403/timeout) — local dogfood fallback',
          { firestoreErr, callableErr },
        );
        return buildLocalSolveFallback({
          examType: request.examType,
          subjectHint: request.subjectHint,
          requestId: request.requestId,
        });
      }
      if (isServerSolveUnavailable(callableErr)) {
        return buildLocalSolveFallback({
          examType: request.examType,
          subjectHint: request.subjectHint,
          requestId: request.requestId,
        });
      }
      throw callableErr;
    }
  }
}
