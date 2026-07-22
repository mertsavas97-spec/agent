/**
 * Call cloud dogfood solve proxy (Vision OCR + arithmetic) when Firebase
 * Functions are blocked by org policy.
 */
import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';

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

export async function callSolveQuestionViaProxy(input: {
  imageUri?: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  examType?: ExamType;
  subjectHint?: Subject;
  requestId: string;
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
  if (
    !input.imageUrl &&
    input.imageBase64 &&
    input.imageBase64.length > MAX_INLINE_IMAGE_BASE64_CHARS
  ) {
    throw Object.assign(
      new Error('INLINE_IMAGE_TOO_LARGE — Storage URL gerekli'),
      { code: 'functions/invalid-argument' },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  const inlineImage =
    input.imageBase64 &&
    input.imageBase64.length <= MAX_INLINE_IMAGE_BASE64_CHARS
      ? input.imageBase64
      : undefined;
  try {
    let res: Response;
    if (input.imageUri) {
      const local = await fetch(input.imageUri, { signal: controller.signal });
      const blob = await local.blob();
      if (blob.size > MAX_BINARY_IMAGE_BYTES) {
        throw Object.assign(new Error('BINARY_IMAGE_TOO_LARGE'), {
          code: 'functions/invalid-argument',
        });
      }
      const contentType = resolveImageContentType(input.mimeType, blob.type);
      res = await fetch(`${base}/solve-image`, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          Accept: 'application/json',
          'Bypass-Tunnel-Reminder': '1',
          'X-Cozbil-Proxy-Token': token,
          'X-Cozbil-Exam-Type': input.examType ?? 'lgs',
          'X-Cozbil-Subject-Hint': input.subjectHint ?? '',
          'X-Cozbil-Request-Id': input.requestId,
        },
        body: blob,
        signal: controller.signal,
      });
    } else {
      res = await fetch(`${base}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          // localtunnel interstitial bypass (harmless on cloudflare)
          'Bypass-Tunnel-Reminder': '1',
          'X-Cozbil-Proxy-Token': token,
        },
        body: JSON.stringify({
          imageUrl: input.imageUrl,
          imageBase64: inlineImage,
          mimeType: input.mimeType ?? 'image/jpeg',
          examType: input.examType,
          subjectHint: input.subjectHint,
          requestId: input.requestId,
        }),
        signal: controller.signal,
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
      if (/no tunnel here|tunnel.*not found|502 Bad Gateway|503 Service/i.test(snippet)) {
        throw Object.assign(new Error('SOLVE_PROXY_TUNNEL_DOWN'), {
          code: 'functions/unavailable',
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
      // Keep a short OCR snippet for client branş lock / local fallback
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
    }    throw Object.assign(new Error('proxy_invalid_response'), { code: 'functions/internal' });
  } finally {
    clearTimeout(timer);
  }
}
