import { httpsCallable } from 'firebase/functions';

import type {
  SolveQuestionRequest,
  SolveQuestionResponse,
  Subject,
} from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

import {
  buildLocalSolveFallback,
  isServerSolveUnavailable,
} from './localSolveFallback';
import { callSolveQuestionViaFirestore } from './solveViaFirestore';
import { callSolveQuestionViaProxy, isSolveProxyConfigured } from './solveViaProxy';

function asSubject(value: unknown): Subject | undefined {
  if (typeof value !== 'string') return undefined;
  const allowed: Subject[] = [
    'math',
    'turkish',
    'science',
    'physics',
    'chemistry',
    'biology',
    'history',
    'geography',
    'philosophy',
    'literature',
    'religion',
    'english',
    'geometry',
    'civics',
    'current',
  ];
  return allowed.includes(value as Subject) ? (value as Subject) : undefined;
}

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
  /** Local image bytes — preferred by proxy (avoids Storage fetch flakiness) */
  imageBase64?: string;
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
  let proxyUnsupported = false;

  // Prefer OCR proxy first — avoids 5–8s pending wait when triggers are undeployed.
  if (isSolveProxyConfigured() && (request.imageUrl || request.imageBase64)) {
    try {
      console.info('solve: OCR proxy');
      const proxy = await callSolveQuestionViaProxy({
        imageUrl: request.imageUrl,
        imageBase64: request.imageBase64,
        mimeType: request.mimeType,
        examType: request.examType,
        subjectHint: request.subjectHint,
        requestId: request.requestId,
      });
      // Parse/OCR miss — skip hard-reject UI; soft local steps instead.
      if (proxy.status === 'unsupported_type') {
        proxyUnsupported = true;
        const detected = asSubject(
          (proxy as { detectedSubject?: string }).detectedSubject,
        );
        const topicId =
          'topicId' in proxy && typeof proxy.topicId === 'string' ? proxy.topicId : null;
        console.warn('solve proxy unsupported_type → local fallback', detected);
        return buildLocalSolveFallback({
          examType: request.examType,
          subjectHint: detected ?? request.subjectHint,
          topicId,
          requestId: request.requestId,
          reason: 'unsupported',
        });
      }
      return proxy;
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
      const {
        requestId: _requestId,
        imageUrl: _imageUrl,
        imageBase64: _imageBase64,
        ...callablePayload
      } = request;
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
          reason: proxyUnsupported ? 'unsupported' : 'unavailable',
        });
      }
      throw callableErr;
    }
  }
}
