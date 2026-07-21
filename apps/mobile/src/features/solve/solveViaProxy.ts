/**
 * Call cloud dogfood solve proxy (Vision OCR + arithmetic) when Firebase
 * Functions are blocked by org policy.
 */
import type { ExamType, SolveQuestionResponse, Subject } from '@/src/lib/api/types';

function proxyBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_SOLVE_PROXY_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

export function isSolveProxyConfigured(): boolean {
  return Boolean(proxyBaseUrl());
}

export async function callSolveQuestionViaProxy(input: {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  examType?: ExamType;
  subjectHint?: Subject;
  requestId: string;
}): Promise<SolveQuestionResponse> {
  const base = proxyBaseUrl();
  if (!base) {
    throw Object.assign(new Error('SOLVE_PROXY_UNCONFIGURED'), {
      code: 'functions/unavailable',
    });
  }
  if (!input.imageUrl && !input.imageBase64) {
    throw Object.assign(new Error('imageUrl veya imageBase64 gerekli'), {
      code: 'functions/invalid-argument',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${base}/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // localtunnel interstitial bypass (harmless on cloudflare)
        'Bypass-Tunnel-Reminder': '1',
      },
      body: JSON.stringify({
        imageUrl: input.imageUrl,
        imageBase64: input.imageBase64,
        mimeType: input.mimeType ?? 'image/jpeg',
        examType: input.examType,
        subjectHint: input.subjectHint,
        requestId: input.requestId,
      }),
      signal: controller.signal,
    });
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
      throw Object.assign(
        new Error(
          `proxy_non_json (${res.status}): ${text.slice(0, 80).replace(/\s+/g, ' ')}`,
        ),
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
