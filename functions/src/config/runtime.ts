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

/** Running inside Cloud Functions / Cloud Run. */
export function isCloudFunctionRuntime(): boolean {
  return Boolean(process.env.FUNCTION_TARGET || process.env.K_SERVICE);
}

/** True → stub solver path (no paid Gemini calls). */
export function isDemoAiMode(): boolean {
  if (process.env.COZBIL_DEMO_AI === '1') return true;
  if (process.env.COZBIL_DEMO_AI === '0') return false;
  if (useVertexAi()) return false;
  return !hasGeminiKey();
}

/**
 * Prod safety: explicit demo flag must not ship on Cloud without override.
 * Throws DemoAiBlockedError.
 */
export function assertDemoAiAllowedInRuntime(): void {
  if (process.env.COZBIL_DEMO_AI !== '1') return;
  if (!isCloudFunctionRuntime()) return;
  if (process.env.COZBIL_ALLOW_DEMO_IN_PROD === '1') return;
  const err = new Error('COZBIL_DEMO_AI=1 cloud üzerinde kapalı (COZBIL_ALLOW_DEMO_IN_PROD=1 ile açılır)');
  err.name = 'DemoAiBlockedError';
  throw err;
}

/** Live solve requires Vision SafeSearch unless demo/open override. */
export function assertVisionConfiguredForLive(): void {
  if (hasVisionKey()) return;
  if (isDemoAiMode()) return;
  if (process.env.COZBIL_ALLOW_OPEN_VISION === '1') return;
  const err = new Error('GOOGLE_CLOUD_VISION_API_KEY gerekli (live SafeSearch)');
  err.name = 'VisionConfigError';
  throw err;
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
