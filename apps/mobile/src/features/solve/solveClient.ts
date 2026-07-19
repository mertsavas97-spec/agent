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
 * Prefer Firestore trigger path (works under Domain Restricted Sharing).
 * Falls back to callable if Firestore path fails unexpectedly; callable
 * 403 → retry Firestore once more is skipped (already primary).
 */
export async function callSolveQuestion(
  request: SolveQuestionRequest & { mimeType?: string },
): Promise<SolveQuestionResponse> {
  // Primary: org-policy safe
  try {
    return await callSolveQuestionViaFirestore(request);
  } catch (firestoreErr) {
    // If trigger not deployed yet, try callable (may also 403)
    console.warn('solveViaFirestore failed, trying callable', firestoreErr);
    try {
      const { functions } = getFirebase();
      const callable = httpsCallable(functions, 'solveQuestion');
      const result = await callable(request);
      return result.data as SolveQuestionResponse;
    } catch (callableErr) {
      if (isInvokerBlocked(callableErr)) {
        throw Object.assign(
          new Error(
            'Sunucu erişim engeli — Firestore solve trigger deploy edilmeli (onSolveRequestCreated).',
          ),
          { code: 'functions/permission-denied' },
        );
      }
      throw callableErr;
    }
  }
}
