import type { SafeSearchLabels } from './safeSearch';

export type VisionClient = {
  safeSearch(imageBuffer: Buffer): Promise<SafeSearchLabels>;
};

/** Real Cloud Vision SafeSearch when API key present. */
export function createVisionClient(
  apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY,
): VisionClient {
  if (!apiKey) {
    return {
      async safeSearch() {
        // Dev/test default: allow (no key). Production must set key.
        return {
          adult: 'VERY_UNLIKELY',
          violence: 'VERY_UNLIKELY',
          racy: 'VERY_UNLIKELY',
        };
      },
    };
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
