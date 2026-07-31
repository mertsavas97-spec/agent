/**
 * Firebase JS Storage uploads are unsupported on React Native:
 * multipart assembly calls `new Blob([string, Uint8Array, string])` and Hermes
 * BlobManager throws "Creating blobs from 'ArrayBuffer'…".
 *
 * This helper uploads via Storage REST + XMLHttpRequest.send(ArrayBuffer).
 */

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.byteLength;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.byteLength;
  }
  return out;
}

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function newDownloadToken(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
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
}): Promise<{ downloadToken: string }> {
  const downloadToken = newDownloadToken();
  const boundary = `cozbil${Date.now().toString(36)}`;
  const metadata = {
    name: input.path,
    contentType: input.contentType,
    metadata: {
      ...(input.customMetadata ?? {}),
      firebaseStorageDownloadTokens: downloadToken,
    },
  };

  const preamble = utf8(
    `--${boundary}\r\n` +
      'Content-Type: application/json; charset=utf-8\r\n\r\n' +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${input.contentType}\r\n\r\n`,
  );
  const epilogue = utf8(`\r\n--${boundary}--`);
  const body = concatBytes([preamble, input.bytes, epilogue]);

  const url =
    `https://firebasestorage.googleapis.com/v0/b/${input.bucket}/o` +
    `?uploadType=multipart&name=${encodeURIComponent(input.path)}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = input.xhrFactory ? input.xhrFactory() : new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'text';
    xhr.setRequestHeader('Authorization', `Bearer ${input.idToken}`);
    xhr.setRequestHeader(
      'Content-Type',
      `multipart/related; boundary=${boundary}`,
    );
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
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
    xhr.send(asArrayBuffer(body));
  });

  return { downloadToken };
}

export function buildTokenDownloadUrl(
  bucket: string,
  path: string,
  downloadToken: string,
): string {
  const encoded = encodeURIComponent(path);
  return (
    `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}` +
    `?alt=media&token=${downloadToken}`
  );
}
