import { gcpAccessToken } from '../ai/gcpAuth';
import { hasVisionKey, isDemoAiMode, useVertexAi } from '../config/runtime';

import type { SafeSearchLabels } from './safeSearch';

export type VisionClient = {
  /** api_key | adc | stub */
  source: 'api_key' | 'adc' | 'stub';
  safeSearch(imageBuffer: Buffer): Promise<SafeSearchLabels>;
};

function allowAllClient(): VisionClient {
  return {
    source: 'stub',
    async safeSearch() {
      return {
        adult: 'VERY_UNLIKELY',
        violence: 'VERY_UNLIKELY',
        racy: 'VERY_UNLIKELY',
      };
    },
  };
}

async function annotateSafeSearch(
  imageBuffer: Buffer,
  auth: { type: 'api_key'; key: string } | { type: 'adc' },
): Promise<SafeSearchLabels> {
  const body = {
    requests: [
      {
        image: { content: imageBuffer.toString('base64') },
        features: [{ type: 'SAFE_SEARCH_DETECTION' }],
      },
    ],
  };
  const url =
    auth.type === 'api_key'
      ? `https://vision.googleapis.com/v1/images:annotate?key=${auth.key}`
      : 'https://vision.googleapis.com/v1/images:annotate';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth.type === 'adc') {
    headers.Authorization = `Bearer ${await gcpAccessToken()}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Vision API ${res.status}`);
  }
  const json = (await res.json()) as {
    responses?: Array<{ safeSearchAnnotation?: SafeSearchLabels }>;
  };
  return json.responses?.[0]?.safeSearchAnnotation ?? {};
}

/**
 * SafeSearch via API key or ADC (Startup billing when COZBIL_USE_VERTEX=1).
 */
export function createVisionClient(
  apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY,
): VisionClient {
  if (apiKey?.trim()) {
    return {
      source: 'api_key',
      async safeSearch(imageBuffer) {
        return annotateSafeSearch(imageBuffer, { type: 'api_key', key: apiKey.trim() });
      },
    };
  }

  if (useVertexAi()) {
    return {
      source: 'adc',
      async safeSearch(imageBuffer) {
        return annotateSafeSearch(imageBuffer, { type: 'adc' });
      },
    };
  }

  const allowOpen =
    isDemoAiMode() || process.env.COZBIL_ALLOW_OPEN_VISION === '1';
  if (allowOpen) return allowAllClient();

  const err = new Error(
    'GOOGLE_CLOUD_VISION_API_KEY veya COZBIL_USE_VERTEX=1 (ADC) gerekli (live SafeSearch)',
  );
  err.name = 'VisionConfigError';
  throw err;
}

export { hasVisionKey };
