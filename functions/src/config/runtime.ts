import { useVertexAi } from '../ai/vertexClient';

export { useVertexAi };

/**
 * Cloud credentials are OPTIONAL until owner connects GCP / Gemini.
 * Prefer Vertex AI (Startup / Cloud Billing) over AI Studio API keys.
 */
export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
}

export function hasVisionKey(): boolean {
  return Boolean(
    process.env.GOOGLE_CLOUD_VISION_API_KEY &&
      process.env.GOOGLE_CLOUD_VISION_API_KEY.trim(),
  );
}

/** True → stub solver + soft SafeSearch (no paid API calls). */
export function isDemoAiMode(): boolean {
  if (process.env.COZBIL_DEMO_AI === '1') return true;
  if (process.env.COZBIL_DEMO_AI === '0') return false;
  if (useVertexAi()) return false;
  return !hasGeminiKey();
}

export function runtimeModeLabel(): 'demo' | 'live' {
  return isDemoAiMode() ? 'demo' : 'live';
}

export function liveBackendLabel(): 'demo' | 'vertex' | 'ai_studio' {
  if (isDemoAiMode()) return 'demo';
  if (useVertexAi()) return 'vertex';
  if (hasGeminiKey()) return 'ai_studio';
  return 'demo';
}
