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
    /403|Forbidden|permission-denied|unauthenticated|not.?found/i.test(`${code} ${message}`)
  );
}

export type SolveClientRequest = SolveQuestionRequest & {
  mimeType?: string;
  requestId: string;
  /** Public download URL for dogfood OCR proxy */
  imageUrl?: string;
};

/**
 * Dogfood order when proxy is configured (org-policy blocks Functions):
 * 1) OCR proxy (real steps)
 * 2) Firestore/Storage trigger
 * 3) Callable
 * 4) Local generic fallback
 */
export async function callSolveQuestion(
  request: SolveClientRequest,
): Promise<SolveQuestionResponse> {
  // Prefer OCR proxy first — avoids 5–8s pending wait when triggers are undeployed.
  if (isSolveProxyConfigured() && request.imageUrl) {
    try {
      console.info('solve: OCR proxy');
      return await callSolveQuestionViaProxy({
        imageUrl: request.imageUrl,
        mimeType: request.mimeType,
        examType: request.examType,
        subjectHint: request.subjectHint,
        requestId: request.requestId,
      });
    } catch (proxyErr) {
      console.warn('solve proxy failed, trying Firebase paths', proxyErr);
    }
  }

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
