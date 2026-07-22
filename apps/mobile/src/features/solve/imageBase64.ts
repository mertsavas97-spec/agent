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

const B64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Pure base64 → bytes (no Node `buffer` package — Metro RN cannot resolve it).
 */
export function decodeBase64ToBytes(base64: string): Uint8Array {
  const clean = normalizeImageBase64(base64);
  if (!clean) {
    throw Object.assign(new Error('EMPTY_IMAGE_BASE64'), {
      code: 'functions/invalid-argument',
    });
  }

  // Prefer runtime atob when present (Hermes / modern Jest).
  if (typeof atob === 'function') {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Fallback decoder for environments without atob.
  const padded = clean + '==='.slice((clean.length + 3) % 4);
  const out: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const a = B64.indexOf(padded[i]!);
    const b = B64.indexOf(padded[i + 1]!);
    const c = B64.indexOf(padded[i + 2]!);
    const d = B64.indexOf(padded[i + 3]!);
    if (a < 0 || b < 0) break;
    out.push((a << 2) | (b >> 4));
    if (padded[i + 2] !== '=' && c >= 0) out.push(((b & 15) << 4) | (c >> 2));
    if (padded[i + 3] !== '=' && d >= 0) out.push(((c & 3) << 6) | d);
  }
  return Uint8Array.from(out);
}
