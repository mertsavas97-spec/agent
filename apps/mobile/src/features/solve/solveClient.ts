import { httpsCallable } from 'firebase/functions';

import type { SolveQuestionRequest, SolveQuestionResponse } from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

import {
  buildLocalSolveFallback,
  isServerSolveUnavailable,
} from './localSolveFallback';
import { callSolveQuestionViaFirestore } from './solveViaFirestore';
import { callSolveQuestionViaProxy, isSolveProxyConfigured } from './solveViaProxy';

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

export type SolveClientRequest = SolveQuestionRequest & {
  mimeType?: string;
  requestId: string;
  /** Public download URL for dogfood OCR proxy */
  imageUrl?: string;
};

/**
 * 1) Firestore/Storage trigger
 * 2) Callable (often 403)
 * 3) Vision OCR proxy (dogfood)
 * 4) Local generic fallback (last resort)
 */
export async function callSolveQuestion(
  request: SolveClientRequest,
): Promise<SolveQuestionResponse> {
  try {
    return await callSolveQuestionViaFirestore(request);
  } catch (firestoreErr) {
    console.warn('solveViaFirestore failed, trying callable', firestoreErr);

    try {
      const { functions } = getFirebase();
      const callable = httpsCallable(functions, 'solveQuestion');
      const { requestId: _requestId, imageUrl: _imageUrl, ...callablePayload } = request;
      const result = await callable(callablePayload);
      return result.data as SolveQuestionResponse;
    } catch (callableErr) {
      console.warn('callable solve failed', callableErr);

      if (isSolveProxyConfigured() && request.imageUrl) {
        try {
          console.warn('trying solve proxy (OCR)');
          return await callSolveQuestionViaProxy({
            imageUrl: request.imageUrl,
            mimeType: request.mimeType,
            examType: request.examType,
            subjectHint: request.subjectHint,
            requestId: request.requestId,
          });
        } catch (proxyErr) {
          console.warn('solve proxy failed', proxyErr);
        }
      }

      if (
        isInvokerBlocked(callableErr) ||
        isServerSolveUnavailable(firestoreErr) ||
        isServerSolveUnavailable(callableErr)
      ) {
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
