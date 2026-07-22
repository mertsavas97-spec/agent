import { httpsCallable } from 'firebase/functions';

import type {
  SolveQuestionRequest,
  SolveQuestionResponse,
} from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

import { isServerSolveUnavailable } from './localSolveFallback';
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

type PreparedFirestoreRequest = SolveQuestionRequest & {
  mimeType?: string;
  requestId: string;
  imageUrl?: string;
};

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
};

/** Proxy is a bounded dogfood path; Firestore remains the authoritative fallback. */
export async function callSolveQuestion(
  request: SolveClientRequest,
): Promise<SolveQuestionResponse> {
  let proxyUnsupported: SolveQuestionResponse | null = null;
  if (
    isSolveProxyConfigured() &&
    (request.imageUri || request.imageUrl || request.imageBase64)
  ) {
    try {
      console.info('solve: bounded OCR proxy');
      const response = await callSolveQuestionViaProxy({
        imageUri: request.imageUri,
        imageUrl: request.imageUrl,
        imageBase64: request.imageBase64,
        mimeType: request.mimeType,
        examType: request.examType,
        subjectHint: request.subjectHint,
        requestId: request.requestId,
      });
      if (response.status === 'unsupported_type') {
        proxyUnsupported = response;
      } else if (isUsableResponse(response)) {
        return response;
      }
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

  let firestoreRequest: PreparedFirestoreRequest | undefined;
  try {
    firestoreRequest = await resolveFirestoreRequest(request);
    const firestore = await callSolveQuestionViaFirestore(firestoreRequest);
    if (isUsableResponse(firestore)) return firestore;
    throw Object.assign(
      new Error('Çözüm üretildi ancak doğrulanabilir bir nihai cevap gelmedi.'),
      { code: 'functions/internal' },
    );
  } catch (firestoreError) {
    if (!firestoreRequest) throw firestoreError;
    // Preserve an honest OCR "unsupported" response instead of manufacturing
    // generic solved steps when the authoritative backend is unavailable.
    if (proxyUnsupported && isServerSolveUnavailable(firestoreError)) {
      return proxyUnsupported;
    }
    return callableOrThrow(request, firestoreError, firestoreRequest);
  }
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
