/**
 * Call cloud dogfood solve proxy (Vision OCR + arithmetic) when Firebase
 * Functions are blocked by org policy.
 */
import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';

import { withHardTimeout } from './hardTimeout';
import { decodeBase64ToBytes } from './imageBase64';
import { PROXY_TIMEOUT_MS } from './solveTiming';

/** Keep JSON safely below the proxy's 6 MiB body limit. Base64 expands bytes by ~33%. */
export const MAX_INLINE_IMAGE_BASE64_CHARS = 3_500_000;
export const MAX_BINARY_IMAGE_BYTES = 10 * 1024 * 1024;
export { PROXY_TIMEOUT_MS } from './solveTiming';

function proxyBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_SOLVE_PROXY_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

function proxyToken(): string | null {
  return process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN?.trim() || null;
}

export function isSolveProxyConfigured(): boolean {
  // The proxy is an explicitly unmoderated dogfood aid. Production must use
  // Storage/Firestore Functions where SafeSearch, quota and auth are enforced.
  return __DEV__ && Boolean(proxyBaseUrl()) && Boolean(proxyToken());
}

/** RN local file blobs often report type "" — never send empty Content-Type. */
export function resolveImageContentType(
  mimeType?: string | null,
  blobType?: string | null,
): string {
  const candidates = [mimeType, blobType, 'image/jpeg'];
  for (const raw of candidates) {
    const v = String(raw ?? '')
      .trim()
      .toLowerCase()
      .split(';')[0];
    if (v.startsWith('image/') && v.length > 'image/'.length) {
      // iOS sometimes reports image/jpg
      return v === 'image/jpg' ? 'image/jpeg' : v;
    }
  }
  return 'image/jpeg';
}

function isAbortOrCancel(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  const name = err instanceof Error ? err.name : '';
  return (
    name === 'AbortError' ||
    /FetchRequestCanceled|aborted|AbortError|The operation was aborted|network request failed|SOLVE_PROXY_TIMEOUT_408/i.test(
      message,
    )
  );
}

function timeoutError(): Error {
  return Object.assign(new Error('SOLVE_TIMEOUT — proxy OCR süresi doldu'), {
    code: 'functions/deadline-exceeded',
  });
}

async function postBinarySolveImage(input: {
  base: string;
  token: string;
  bytes: ArrayBuffer | Uint8Array;
  mimeType?: string;
  examType?: ExamType;
  subjectHint?: Subject;
  requestId: string;
  signal: AbortSignal;
}): Promise<Response> {
  const byteLength =
    input.bytes instanceof Uint8Array ? input.bytes.byteLength : input.bytes.byteLength;
  if (byteLength > MAX_BINARY_IMAGE_BYTES) {
    throw Object.assign(new Error('BINARY_IMAGE_TOO_LARGE'), {
      code: 'functions/invalid-argument',
    });
  }
  const contentType = resolveImageContentType(input.mimeType, null);
  return fetch(`${input.base}/solve-image`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Accept: 'application/json',
      'Bypass-Tunnel-Reminder': '1',
      'X-Cozbil-Proxy-Token': input.token,
      'X-Cozbil-Exam-Type': input.examType ?? 'lgs',
      'X-Cozbil-Subject-Hint': input.subjectHint ?? '',
      'X-Cozbil-Request-Id': input.requestId,
    },
    body: input.bytes as BodyInit,
    signal: input.signal,
  });
}

async function postSolveOnce(input: {
  base: string;
  token: string;
  imageUri?: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  examType?: ExamType;
  subjectHint?: Subject;
  requestId: string;
  signal: AbortSignal;
}): Promise<SolveQuestionResponse> {
  const inlineImage =
    input.imageBase64 &&
    input.imageBase64.length <= MAX_INLINE_IMAGE_BASE64_CHARS
      ? input.imageBase64
      : undefined;

  let res: Response;
  // Prefer picker base64 bytes over URI fetch — camera content:// / ph:// often fails.
  if (input.imageBase64 && !input.imageUrl) {
    const decoded = decodeBase64ToBytes(input.imageBase64);
    res = await postBinarySolveImage({
      base: input.base,
      token: input.token,
      bytes: decoded,
      mimeType: input.mimeType,
      examType: input.examType,
      subjectHint: input.subjectHint,
      requestId: input.requestId,
      signal: input.signal,
    });
  } else if (input.imageUri && !input.imageUrl) {
    const local = await fetch(input.imageUri, { signal: input.signal });
    // Prefer ArrayBuffer — RN Blob round-trip is slow and often cancels mid-upload.
    const bytes = await local.arrayBuffer();
    res = await postBinarySolveImage({
      base: input.base,
      token: input.token,
      bytes,
      mimeType: input.mimeType,
      examType: input.examType,
      subjectHint: input.subjectHint,
      requestId: input.requestId,
      signal: input.signal,
    });
  } else {
    res = await fetch(`${input.base}/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // localtunnel interstitial bypass (harmless on cloudflare)
        'Bypass-Tunnel-Reminder': '1',
        'X-Cozbil-Proxy-Token': input.token,
      },
      body: JSON.stringify({
        imageUrl: input.imageUrl,
        imageBase64: inlineImage,
        mimeType: input.mimeType ?? 'image/jpeg',
        examType: input.examType,
        subjectHint: input.subjectHint,
        requestId: input.requestId,
      }),
      signal: input.signal,
    });
  }

  const text = await res.text();
  let data: SolveQuestionResponse & {
    error?: string;
    message?: string;
    debugOcrPreview?: string;
    ocrPreview?: string;
    detectedSubject?: string;
    topicId?: string | null;
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    const snippet = text.slice(0, 120).replace(/\s+/g, ' ');
    if (/no tunnel here|tunnel.*not found|502 Bad Gateway|503 Service|Tunnel Unavailable/i.test(snippet)) {
      throw Object.assign(new Error('SOLVE_PROXY_TUNNEL_DOWN'), {
        code: 'functions/unavailable',
      });
    }
    // localtunnel often returns empty 408 while OCR is still running.
    if (res.status === 408 || /408|timeout|Gateway Time-out/i.test(`${res.status} ${snippet}`)) {
      throw Object.assign(new Error('SOLVE_PROXY_TIMEOUT_408'), {
        code: 'functions/deadline-exceeded',
      });
    }
    throw Object.assign(
      new Error(`proxy_non_json (${res.status}): ${snippet}`),
      { code: 'functions/unavailable' },
    );
  }
  if (!res.ok) {
    throw Object.assign(new Error(data.message || data.error || 'proxy_error'), {
      code: 'functions/internal',
    });
  }
  if (
    data.status === 'solved' ||
    data.status === 'unsupported_type' ||
    (typeof data.status === 'string' && data.status.startsWith('rejected'))
  ) {
    const { error: _e, message: _m, debugOcrPreview, ...rest } = data;
    const ocrPreview =
      typeof debugOcrPreview === 'string'
        ? debugOcrPreview
        : typeof data.ocrPreview === 'string'
          ? data.ocrPreview
          : undefined;
    return {
      ...rest,
      ...(ocrPreview ? { ocrPreview } : {}),
    } as SolveQuestionResponse & { ocrPreview?: string };
  }
  throw Object.assign(new Error('proxy_invalid_response'), { code: 'functions/internal' });
}

export async function callSolveQuestionViaProxy(input: {
  imageUri?: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  examType?: ExamType;
  subjectHint?: Subject;
  requestId: string;
  onStage?: (stage: 'upload' | 'ocr' | 'solving') => void;
}): Promise<SolveQuestionResponse> {
  const base = proxyBaseUrl();
  const token = proxyToken();
  if (!base || !token) {
    throw Object.assign(new Error('SOLVE_PROXY_UNCONFIGURED'), {
      code: 'functions/unavailable',
    });
  }
  if (!input.imageUri && !input.imageUrl && !input.imageBase64) {
    throw Object.assign(new Error('imageUrl veya imageBase64 gerekli'), {
      code: 'functions/invalid-argument',
    });
  }
  input.onStage?.('ocr');
  // Large picker base64 is posted as binary `/solve-image` (not JSON). Only reject
  // oversized base64 when the caller also has no URI and we somehow cannot decode —
  // decode path below enforces MAX_BINARY_IMAGE_BYTES.

  // One retry only for empty tunnel 408 — never stack two full PROXY_TIMEOUT waits.
  const maxAttempts = input.imageUri || (input.imageBase64 && !input.imageUrl) ? 2 : 1;
  const budgetStarted = Date.now();
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const remaining = PROXY_TIMEOUT_MS - (Date.now() - budgetStarted);
    if (remaining < 3_000) break;
    const controller = new AbortController();
    // Soft abort (often ignored by RN for large bodies) + hard Promise.race.
    const softTimer = setTimeout(() => controller.abort(), remaining);
    // Proxy does OCR+solve in one request — promote UI past "Metin okunuyor"
    // after a short beat so the bar/checklist don't freeze at ~40%.
    const promoteSolving = setTimeout(() => input.onStage?.('solving'), attempt === 1 ? 1600 : 0);
    try {
      input.onStage?.(attempt === 1 ? 'ocr' : 'solving');
      const response = await withHardTimeout(
        postSolveOnce({
          base,
          token,
          imageUri: input.imageUri,
          imageUrl: input.imageUrl,
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
          examType: input.examType,
          subjectHint: input.subjectHint,
          requestId: attempt === 1 ? input.requestId : `${input.requestId}-r${attempt}`,
          signal: controller.signal,
        }),
        remaining,
        'proxy OCR',
      );
      input.onStage?.('solving');
      return response;
    } catch (err) {
      lastError = err;
      const is408 =
        err instanceof Error && /SOLVE_PROXY_TIMEOUT_408/i.test(err.message);
      if (is408 && attempt < maxAttempts) {
        console.warn('solve proxy empty 408, retrying once within budget', err);
        continue;
      }
      if (controller.signal.aborted || isAbortOrCancel(err)) {
        throw timeoutError();
      }
      throw err;
    } finally {
      clearTimeout(softTimer);
      clearTimeout(promoteSolving);
    }
  }
  throw lastError instanceof Error ? lastError : timeoutError();
}
