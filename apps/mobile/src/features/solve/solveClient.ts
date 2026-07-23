import { httpsCallable } from 'firebase/functions';

import type {
  SolveQuestionRequest,
  SolveQuestionResponse,
} from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

import { withHardTimeout } from './hardTimeout';
import { isServerSolveUnavailable } from './localSolveFallback';
import { callSolveQuestionViaFirestore } from './solveViaFirestore';
import { callSolveQuestionViaProxy, isSolveProxyConfigured } from './solveViaProxy';
import { FIRESTORE_FALLBACK_MS, SOLVE_TIMEOUT_MS } from './solveTiming';

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

type PreparedFirestoreRequest = SolveQuestionRequest & {
  mimeType?: string;
  requestId: string;
  imageUrl?: string;
};

export type SolvePipelineStage = 'upload' | 'ocr' | 'solving';

export type SolveClientRequest = Omit<SolveQuestionRequest, 'imagePath'> & {
  imagePath?: string;
  mimeType?: string;
  requestId: string;
  /** Bounded local bytes for the development-only OCR proxy. */
  imageBase64?: string;
  /** Local camera/gallery URI sent as raw binary to avoid base64 expansion. */
  imageUri?: string;
  imageUrl?: string;
  /** Lazily upload only if proxy is disabled/unsupported/unavailable. */
  prepareFirestore?: () => Promise<PreparedFirestoreRequest>;
  /** Best-effort UI stage hooks (proxy / upload / solve). */
  onStage?: (stage: SolvePipelineStage) => void;
};

/** Proxy is a bounded dogfood path; Firestore remains the authoritative fallback. */
export async function callSolveQuestion(
  request: SolveClientRequest,
): Promise<SolveQuestionResponse> {
  let proxyAttempted = false;
  if (
    isSolveProxyConfigured() &&
    (request.imageUri || request.imageUrl || request.imageBase64)
  ) {
    proxyAttempted = true;
    try {
      console.info('solve: bounded OCR proxy');
      request.onStage?.('ocr');
      const response = await callSolveQuestionViaProxy({
        imageUri: request.imageUri,
        imageUrl: request.imageUrl,
        imageBase64: request.imageBase64,
        mimeType: request.mimeType,
        examType: request.examType,
        subjectHint: request.subjectHint,
        requestId: request.requestId,
        onStage: request.onStage,
      });
      // Terminal OCR outcomes must not fall into Storage upload — that path
      // hangs forever on flaky networks and leaves the UI stuck at ~99%.
      if (
        response.status === 'unsupported_type' ||
        (typeof response.status === 'string' &&
          response.status.startsWith('rejected'))
      ) {
        console.info('solve: proxy terminal', response.status);
        return normalizeTerminalProxyResponse(response, request.requestId);
      }
      if (isUsableResponse(response)) {
        return response;
      }
      // Solved-without-answer / assisted tip — try authoritative backend below.
    } catch (proxyError) {
      console.warn('solve proxy failed, trying Firestore', proxyError);
      const proxyMsg = proxyError instanceof Error ? proxyError.message : '';
      // Don't fall through to a dead Functions path for honest OCR failures.
      if (/OCR unavailable|garbage_ocr|unsupported image format/i.test(proxyMsg)) {
        return {
          status: 'rejected_not_question',
          attemptId: `proxy-ocr-${request.requestId}`,
          userMessage:
            'Görseldeki yazı net okunamadı. Soruyu düz, yakından ve iyi ışıkta yeniden çek; şıklar da kadrajda olsun.',
          quota: { remainingToday: 5, unlimited: false },
        };
      }
    }
  }

  // Primary production path needs the full solve budget; after a proxy miss keep fallback snappy.
  const firestoreWaitMs = proxyAttempted ? FIRESTORE_FALLBACK_MS : SOLVE_TIMEOUT_MS;
  const uploadWaitMs = FIRESTORE_FALLBACK_MS;

  let firestoreRequest: PreparedFirestoreRequest | undefined;
  try {
    request.onStage?.('upload');
    firestoreRequest = await withHardTimeout(
      resolveFirestoreRequest(request),
      uploadWaitMs,
      'Storage upload',
    );
    request.onStage?.('solving');
    const firestore = await withHardTimeout(
      callSolveQuestionViaFirestore(firestoreRequest),
      firestoreWaitMs,
      'Firestore solve',
    );
    if (isUsableResponse(firestore)) return firestore;
    throw Object.assign(
      new Error('Çözüm üretildi ancak doğrulanabilir bir nihai cevap gelmedi.'),
      { code: 'functions/internal' },
    );
  } catch (firestoreError) {
    // Hard timeout on upload/Firestore — still settle the UI with a real error.
    if (
      firestoreError instanceof Error &&
      /SOLVE_TIMEOUT/i.test(firestoreError.message)
    ) {
      throw firestoreError;
    }
    if (!firestoreRequest) throw firestoreError;
    return callableOrThrow(request, firestoreError, firestoreRequest);
  }
}

function normalizeTerminalProxyResponse(
  response: SolveQuestionResponse,
  requestId: string,
): SolveQuestionResponse {
  if (response.status === 'unsupported_type') {
    return {
      ...response,
      status: 'rejected_not_question',
      attemptId: response.attemptId || `proxy-unsup-${requestId}`,
      userMessage:
        response.userMessage?.trim() ||
        'Bu görseldeki yazı net okunamadı. Soruyu düz, yakından ve iyi ışıkta yeniden çek.',
    };
  }
  return response;
}

async function resolveFirestoreRequest(
  request: SolveClientRequest,
): Promise<PreparedFirestoreRequest> {
  if (request.imagePath) {
    return {
      imagePath: request.imagePath,
      mimeType: request.mimeType,
      requestId: request.requestId,
      examType: request.examType,
      subjectHint: request.subjectHint,
      imageUrl: request.imageUrl,
    };
  }
  if (request.prepareFirestore) {
    return request.prepareFirestore();
  }
  throw Object.assign(new Error('FIRESTORE_IMAGE_NOT_PREPARED'), {
    code: 'functions/invalid-argument',
  });
}

function isUsableResponse(response: SolveQuestionResponse): boolean {
  if (response.status !== 'solved') return true;
  if (response.assisted) return false;
  // Label-only (A–E) is enough — SolutionScreen can display it.
  if (response.answer?.text?.trim()) return true;
  return Boolean(response.answer?.label?.trim());
}

async function callableOrThrow(
  request: SolveClientRequest,
  firestoreError: unknown,
  prepared?: PreparedFirestoreRequest,
): Promise<SolveQuestionResponse> {
  if (isServerSolveUnavailable(firestoreError)) {
    throw unavailableError(firestoreError);
  }

  console.warn('solveViaFirestore failed, trying callable', firestoreError);
  try {
    const { functions } = getFirebase();
    const callable = httpsCallable(functions, 'solveQuestion');
    const callablePayload = {
      imagePath: prepared?.imagePath ?? request.imagePath,
      mimeType: prepared?.mimeType ?? request.mimeType,
      examType: prepared?.examType ?? request.examType,
      subjectHint: prepared?.subjectHint ?? request.subjectHint,
    };
    const result = await callable(callablePayload);
    const response = result.data as SolveQuestionResponse;
    if (!isUsableResponse(response)) {
      throw Object.assign(
        new Error('Callable çözümünde doğrulanabilir nihai cevap yok.'),
        { code: 'functions/internal' },
      );
    }
    return response;
  } catch (callableError) {
    console.warn('callable solve failed', callableError);
    if (
      isInvokerBlocked(callableError) ||
      isServerSolveUnavailable(callableError)
    ) {
      throw unavailableError(callableError);
    }
    throw callableError;
  }
}

function unavailableError(cause?: unknown): Error {
  return Object.assign(
    new Error(
      'Çözüm servisine şu an ulaşılamadı. Fotoğrafın yüklendi; lütfen biraz sonra tekrar dene.',
    ),
    {
      code: 'functions/unavailable',
      cause,
    },
  );
}
