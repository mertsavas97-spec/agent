import { httpsCallable } from 'firebase/functions';

import type {
  SolveQuestionRequest,
  SolveQuestionResponse,
  Subject,
  SubjectClassificationMeta,
} from '@/src/lib/api/types';
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
    'unknown',
  ];
  return allowed.includes(value as Subject) ? (value as Subject) : undefined;
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
      if (proxy.status === 'unsupported_type') {
        proxyUnsupported = true;
        const detected = asSubject(
          (proxy as { detectedSubject?: string }).detectedSubject,
        );
        const topicId =
          'topicId' in proxy && typeof proxy.topicId === 'string' ? proxy.topicId : null;
        const classMeta = (proxy as { classification?: SubjectClassificationMeta })
          .classification;
        console.warn('solve proxy unsupported_type → local fallback', detected);
        const fallback = buildLocalSolveFallback({
          examType: request.examType,
          subjectHint: detected && detected !== 'unknown' ? detected : request.subjectHint,
          topicId,
          requestId: request.requestId,
          reason: 'unsupported',
        });
        if (fallback.status === 'solved') {
          return {
            ...fallback,
            classification: {
              subject: detected ?? fallback.subject,
              confidence: classMeta?.confidence ?? 'low',
              needsConfirm: true,
              alternatives: classMeta?.alternatives,
            },
          };
        }
        return fallback;
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
        const fallback = buildLocalSolveFallback({
          examType: request.examType,
          subjectHint: request.subjectHint,
          requestId: request.requestId,
          reason: proxyUnsupported ? 'unsupported' : 'unavailable',
        });
        if (fallback.status === 'solved' && !request.subjectHint) {
          return {
            ...fallback,
            classification: {
              subject: fallback.subject,
              confidence: 'low',
              needsConfirm: true,
            },
          };
        }
        return fallback;
      }
      throw callableErr;
    }
  }
}
