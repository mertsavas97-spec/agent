/** Convert a local image URI to raw base64 (no data: prefix). */
export async function uriToBase64(uri: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 80) return null;

    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  } catch (err) {
    console.warn('uriToBase64 failed', err);
    return null;
  }
}

/** Strip data-URL prefix / whitespace from picker or paste payloads. */
export function normalizeImageBase64(raw: string): string {
  return raw.replace(/^data:[^;]+;base64,/i, '').replace(/\s/g, '');
}

/**
 * Decode picker `base64` into bytes for `/solve-image` uploads.
 * Prefer this over `fetch(content://…)` — camera URIs often fail on Android.
 */
export function decodeBase64ToBytes(base64: string): Uint8Array {
  const clean = normalizeImageBase64(base64);
  if (!clean) {
    throw Object.assign(new Error('EMPTY_IMAGE_BASE64'), {
      code: 'functions/invalid-argument',
    });
  }

  if (typeof atob === 'function') {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Jest / Node without atob
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Buffer } = require('buffer') as typeof import('buffer');
  return Uint8Array.from(Buffer.from(clean, 'base64'));
}
