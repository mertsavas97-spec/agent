/**
 * Firebase JS Storage uploads are unsupported on React Native:
 * multipart assembly calls `new Blob([string, Uint8Array, string])` and Hermes
 * BlobManager throws "Creating blobs from 'ArrayBuffer'…".
 *
 * Workaround: Storage REST `uploadType=media` (raw bytes) + JSON metadata PATCH
 * for allowed custom keys only.
 *
 * Do NOT set `firebaseStorageDownloadTokens` — Firebase returns 400
 * "Not allowed to set custom metadata for firebaseStorageDownloadTokens".
 * Solve pipeline uses `imagePath` (Admin SDK); download URL is best-effort.
 */

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function xhrRequest(input: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | ArrayBuffer;
  xhrFactory?: () => XMLHttpRequest;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = input.xhrFactory ? input.xhrFactory() : new XMLHttpRequest();
    xhr.open(input.method, input.url);
    xhr.responseType = 'text';
    for (const [k, v] of Object.entries(input.headers)) {
      xhr.setRequestHeader(k, v);
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(String(xhr.responseText ?? ''));
        return;
      }
      const snippet = String(xhr.responseText ?? '').slice(0, 240);
      reject(
        Object.assign(new Error(`STORAGE_UPLOAD_${xhr.status}: ${snippet}`), {
          code: 'functions/internal',
        }),
      );
    };
    xhr.onerror = () => {
      reject(
        Object.assign(new Error('STORAGE_UPLOAD_NETWORK'), {
          code: 'functions/unavailable',
        }),
      );
    };
    xhr.send(input.body);
  });
}

export async function uploadBytesViaStorageRest(input: {
  bucket: string;
  path: string;
  bytes: Uint8Array;
  contentType: string;
  idToken: string;
  customMetadata?: Record<string, string>;
  /** Override for tests. */
  xhrFactory?: () => XMLHttpRequest;
}): Promise<{ uploaded: true }> {
  const auth = `Bearer ${input.idToken}`;

  // 1) Raw media upload — no multipart / no Blob
  const mediaUrl =
    `https://firebasestorage.googleapis.com/v0/b/${input.bucket}/o` +
    `?name=${encodeURIComponent(input.path)}&uploadType=media`;

  await xhrRequest({
    method: 'POST',
    url: mediaUrl,
    headers: {
      Authorization: auth,
      'Content-Type': input.contentType,
    },
    body: asArrayBuffer(input.bytes),
    xhrFactory: input.xhrFactory,
  });

  // 2) Optional custom metadata for Storage trigger (examType, cozbilSolve, …)
  // Never include firebaseStorageDownloadTokens — Firebase rejects it from clients.
  const custom = { ...(input.customMetadata ?? {}) };
  delete custom.firebaseStorageDownloadTokens;

  if (Object.keys(custom).length > 0) {
    const metaUrl =
      `https://firebasestorage.googleapis.com/v0/b/${input.bucket}/o/` +
      `${encodeURIComponent(input.path)}`;

    await xhrRequest({
      method: 'PATCH',
      url: metaUrl,
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        contentType: input.contentType,
        metadata: custom,
      }),
      xhrFactory: input.xhrFactory,
    });
  }

  return { uploaded: true };
}

export function buildGsUrl(bucket: string, path: string): string {
  return `gs://${bucket}/${path}`;
}
