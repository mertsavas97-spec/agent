export const MAX_REMOTE_IMAGE_BYTES = 8 * 1024 * 1024;
export const REMOTE_IMAGE_TIMEOUT_MS = 12_000;

export function allowedImageUrl(raw, { allowLoopback = false } = {}) {
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();
  const loopback = host === '127.0.0.1' || host === 'localhost' || host === '::1';
  const firebaseStorage =
    host === 'firebasestorage.googleapis.com' ||
    host === 'storage.googleapis.com' ||
    host.endsWith('.firebasestorage.app');
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && loopback && allowLoopback)
  ) {
    throw new Error('image_url_protocol');
  }
  if (!(loopback && allowLoopback) && !firebaseStorage) {
    throw new Error('image_url_host');
  }
  return url;
}

export function allowedRedirectUrl(current, location, options = {}) {
  return allowedImageUrl(new URL(location, current).toString(), options);
}

export async function readBodyLimited(res, maxBytes = MAX_REMOTE_IMAGE_BYTES) {
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('image_too_large');
  if (!res.body) throw new Error('image_empty');
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('image_too_large');
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, size);
}
