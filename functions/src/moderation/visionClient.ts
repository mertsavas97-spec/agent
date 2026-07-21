import { hasVisionKey, isDemoAiMode } from '../config/runtime';

import type { SafeSearchLabels } from './safeSearch';

export type VisionClient = {
  safeSearch(imageBuffer: Buffer): Promise<SafeSearchLabels>;
};

function allowAllClient(): VisionClient {
  return {
    async safeSearch() {
      return {
        adult: 'VERY_UNLIKELY',
        violence: 'VERY_UNLIKELY',
        racy: 'VERY_UNLIKELY',
      };
    },
  };
}

/**
 * Real Cloud Vision SafeSearch when API key present.
 * Live mode without key → fail-closed (VisionConfigError) unless demo / open override.
 */
export function createVisionClient(
  apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY,
): VisionClient {
  if (!apiKey?.trim()) {
    const allowOpen =
      isDemoAiMode() || process.env.COZBIL_ALLOW_OPEN_VISION === '1';
    if (allowOpen) return allowAllClient();
    const err = new Error('GOOGLE_CLOUD_VISION_API_KEY gerekli (live SafeSearch)');
    err.name = 'VisionConfigError';
    throw err;
  }

  return {
    async safeSearch(imageBuffer) {
      const body = {
        requests: [
          {
            image: { content: imageBuffer.toString('base64') },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          },
        ],
      };
      const res = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        throw new Error(`Vision API ${res.status}`);
      }
      const json = (await res.json()) as {
        responses?: Array<{ safeSearchAnnotation?: SafeSearchLabels }>;
      };
      return json.responses?.[0]?.safeSearchAnnotation ?? {};
    },
  };
}

export { hasVisionKey };
