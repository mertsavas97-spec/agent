/**
 * RN cannot use Firebase uploadBytes/uploadString (Blob + ArrayBufferView).
 * uploadQuestionImage must go through Storage REST + XHR.
 */

const mockGetIdToken = jest.fn(async () => 'id-token-test');
const mockGetDownloadURL = jest.fn(
  async (_ref?: unknown) => 'https://cdn.example/from-sdk',
);
const mockRestUpload = jest.fn(async (_input?: unknown) => ({
  downloadToken: 'tok-abc',
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((_storage: unknown, path: string) => ({ path })),
  getDownloadURL: (r: unknown) => mockGetDownloadURL(r),
  uploadString: jest.fn(async () => {
    throw new Error('uploadString must not be used on RN');
  }),
  uploadBytes: jest.fn(async () => {
    throw new Error('uploadBytes must not be used on RN');
  }),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({
    storage: {
      app: { options: { storageBucket: 'cozbil-dev-f9583.firebasestorage.app' } },
    },
    auth: {
      currentUser: { uid: 'u1', getIdToken: mockGetIdToken },
    },
  }),
}));

jest.mock('@/src/features/solve/imageBase64', () => ({
  normalizeImageBase64: (s: string) => s.replace(/^data:[^;]+;base64,/i, ''),
  uriToBase64: jest.fn(async () => 'dGVzdA=='),
  decodeBase64ToBytes: () => Uint8Array.from([97, 98, 99]),
}));

jest.mock('@/src/features/solve/storageRestUpload', () => ({
  uploadBytesViaStorageRest: (input: unknown) => mockRestUpload(input),
  buildTokenDownloadUrl: (bucket: string, path: string, token: string) =>
    `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
}));

import { uploadBytes, uploadString } from 'firebase/storage';

import { uploadQuestionImage } from '@/src/features/solve/upload';

function mockXhr(status = 200, responseText = '{}') {
  const xhr: {
    open: jest.Mock;
    setRequestHeader: jest.Mock;
    send: jest.Mock;
    onload: null | (() => void);
    onerror: null | (() => void);
    status: number;
    responseText: string;
    responseType: string;
  } = {
    open: jest.fn(),
    setRequestHeader: jest.fn(),
    send: jest.fn(function send(this: typeof xhr) {
      queueMicrotask(() => this.onload?.());
    }),
    onload: null,
    onerror: null,
    status,
    responseText,
    responseType: '',
  };
  return xhr;
}

describe('uploadQuestionImage (RN-safe REST)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDownloadURL.mockResolvedValue('https://cdn.example/from-sdk');
    mockGetIdToken.mockResolvedValue('id-token-test');
    mockRestUpload.mockResolvedValue({ downloadToken: 'tok-abc' });
  });

  it('uploads via REST and does not call uploadBytes/uploadString', async () => {
    const result = await uploadQuestionImage({
      uid: 'u1',
      localId: 'local-1',
      base64: 'data:image/jpeg;base64,YWJj',
      mimeType: 'image/jpeg',
      examType: 'lgs',
    });

    expect(uploadString).not.toHaveBeenCalled();
    expect(uploadBytes).not.toHaveBeenCalled();
    expect(mockRestUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: 'cozbil-dev-f9583.firebasestorage.app',
        idToken: 'id-token-test',
        contentType: 'image/jpeg',
        customMetadata: expect.objectContaining({
          cozbilSolve: '1',
          examType: 'lgs',
        }),
      }),
    );
    expect(result.downloadUrl).toBe('https://cdn.example/from-sdk');
    expect(result.imagePath).toContain('users/u1/uploads/');
  });

  it('falls back to token download URL when getDownloadURL fails', async () => {
    mockGetDownloadURL.mockRejectedValueOnce(new Error('no url'));
    mockRestUpload.mockResolvedValueOnce({ downloadToken: 'tok-fallback' });

    const result = await uploadQuestionImage({
      uid: 'u1',
      localId: 'local-2',
      base64: 'YWJj',
    });

    expect(result.downloadUrl).toContain('alt=media&token=tok-fallback');
    expect(result.downloadUrl).toContain('firebasestorage.googleapis.com');
  });
});

describe('uploadBytesViaStorageRest xhr', () => {
  it('POSTs multipart ArrayBuffer body', async () => {
    // Use the mocked export only for call signature — load real via requireActual
    const real = jest.requireActual(
      '@/src/features/solve/storageRestUpload',
    ) as typeof import('@/src/features/solve/storageRestUpload');
    const xhr = mockXhr(200);
    const result = await real.uploadBytesViaStorageRest({
      bucket: 'bucket.appspot.com',
      path: 'users/u1/uploads/1.jpg',
      bytes: Uint8Array.from([1, 2, 3, 4]),
      contentType: 'image/jpeg',
      idToken: 'tok',
      customMetadata: { cozbilSolve: '1' },
      xhrFactory: () => xhr as unknown as XMLHttpRequest,
    });

    expect(result.downloadToken).toBeTruthy();
    expect(xhr.open).toHaveBeenCalledWith(
      'POST',
      expect.stringContaining('uploadType=multipart'),
    );
    expect(xhr.send).toHaveBeenCalledWith(expect.any(ArrayBuffer));
  });

  it('rejects on non-2xx', async () => {
    const real = jest.requireActual(
      '@/src/features/solve/storageRestUpload',
    ) as typeof import('@/src/features/solve/storageRestUpload');
    const xhr = mockXhr(403, 'denied');
    await expect(
      real.uploadBytesViaStorageRest({
        bucket: 'b',
        path: 'p.jpg',
        bytes: Uint8Array.from([9]),
        contentType: 'image/jpeg',
        idToken: 'tok',
        xhrFactory: () => xhr as unknown as XMLHttpRequest,
      }),
    ).rejects.toThrow(/STORAGE_UPLOAD_403/);
  });
});
