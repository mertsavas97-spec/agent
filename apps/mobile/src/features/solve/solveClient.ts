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
    'traffic',
    'vehicle',
    'firstaid',
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
 * 2) Firestore/Storage trigger (Vertex) — also after proxy unsupported_type
 * 3) Callable
 * 4) Local generic fallback
 */
export async function callSolveQuestion(
  request: SolveClientRequest,
): Promise<SolveQuestionResponse> {
  let proxyUnsupported = false;
  let proxyUnsupportedMeta: {
    detected?: Subject;
    topicId?: string | null;
    classMeta?: SubjectClassificationMeta;
    examHint?: SolveQuestionResponse['examHint'];
    ocrPreview?: string;
  } | null = null;

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
        // Do not soft-fail here — Vertex/Firestore may still solve word problems.
        proxyUnsupported = true;
        const proxyExtra = proxy as SolveQuestionResponse & {
          detectedSubject?: string;
          topicId?: string | null;
          ocrPreview?: string;
          debugOcrPreview?: string;
        };
        const detected = asSubject(proxyExtra.detectedSubject);
        const topicId =
          typeof proxyExtra.topicId === 'string' ? proxyExtra.topicId : null;
        const classMeta = proxyExtra.classification;
        const examHint = proxyExtra.examHint;
        const ocrPreview =
          typeof proxyExtra.ocrPreview === 'string'
            ? proxyExtra.ocrPreview
            : typeof proxyExtra.debugOcrPreview === 'string'
              ? proxyExtra.debugOcrPreview
              : undefined;
        proxyUnsupportedMeta = {
          detected,
          topicId,
          classMeta,
          examHint,
          ocrPreview,
        };
        console.warn(
          'solve proxy unsupported_type → try Firestore/Vertex before local tips',
          detected,
        );
      } else {
        return proxy;
      }
    } catch (proxyErr) {
      console.warn('solve proxy failed, trying Firebase paths', proxyErr);
    }
  }

  try {
    return await callSolveQuestionViaFirestore(request);
  } catch (firestoreErr) {
    // Org policy blocks public callable invoker — skip after trigger timeout.
    if (isServerSolveUnavailable(firestoreErr)) {
      console.warn('solveViaFirestore unavailable → local fallback (skip callable)', firestoreErr);
      return localFallbackFromProxyMeta(request, proxyUnsupported, proxyUnsupportedMeta);
    }

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
        isServerSolveUnavailable(callableErr)
      ) {
        return localFallbackFromProxyMeta(request, proxyUnsupported, proxyUnsupportedMeta);
      }
      throw callableErr;
    }
  }
}

function localFallbackFromProxyMeta(
  request: SolveClientRequest,
  proxyUnsupported: boolean,
  meta: {
    detected?: Subject;
    topicId?: string | null;
    classMeta?: SubjectClassificationMeta;
    examHint?: SolveQuestionResponse['examHint'];
    ocrPreview?: string;
  } | null,
): SolveQuestionResponse {
  if (proxyUnsupported && meta) {
    const fallback = buildLocalSolveFallback({
      examType: request.examType,
      subjectHint:
        meta.detected && meta.detected !== 'unknown'
          ? meta.detected
          : request.subjectHint,
      topicId: meta.topicId,
      requestId: request.requestId,
      reason: 'unsupported',
      ocrText: meta.ocrPreview,
    });
    if (fallback.status === 'solved') {
      const detectedSubject = meta.detected ?? fallback.subject;
      const isTrafikBranch =
        detectedSubject === 'traffic' ||
        detectedSubject === 'vehicle' ||
        detectedSubject === 'firstaid';
      const confidence = meta.classMeta?.confidence ?? (isTrafikBranch ? 'medium' : 'low');
      return {
        ...fallback,
        ...(meta.examHint ? { examHint: meta.examHint } : {}),
        ...(meta.ocrPreview ? { ocrPreview: meta.ocrPreview } : {}),
        classification: {
          subject: detectedSubject === 'unknown' ? fallback.subject : detectedSubject,
          confidence,
          needsConfirm:
            request.examType === 'trafik' && isTrafikBranch
              ? false
              : confidence !== 'high',
          alternatives: meta.classMeta?.alternatives,
        },
      } as SolveQuestionResponse;
    }
    return meta.examHint ? { ...fallback, examHint: meta.examHint } : fallback;
  }
  return localFallback(request, proxyUnsupported);
}

function localFallback(
  request: SolveClientRequest,
  proxyUnsupported: boolean,
): SolveQuestionResponse {
  const fallback = buildLocalSolveFallback({
    examType: request.examType,
    subjectHint: request.subjectHint,
    requestId: request.requestId,
    reason: proxyUnsupported ? 'unsupported' : 'unavailable',
  });
  if (fallback.status === 'solved' && !request.subjectHint) {
    const isTrafik =
      request.examType === 'trafik' ||
      fallback.subject === 'traffic' ||
      fallback.subject === 'vehicle' ||
      fallback.subject === 'firstaid';
    return {
      ...fallback,
      classification: {
        subject: fallback.subject,
        confidence: isTrafik ? 'medium' : 'low',
        needsConfirm: !isTrafik,
      },
    };
  }
  return fallback;
}
