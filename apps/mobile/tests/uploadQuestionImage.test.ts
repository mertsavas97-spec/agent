/**
 * RN cannot use Firebase uploadBytes/uploadString (Blob + ArrayBufferView).
 * uploadQuestionImage must go through Storage REST + XHR.
 */

const mockGetIdToken = jest.fn(async () => 'id-token-test');
const mockGetDownloadURL = jest.fn(
  async (_ref?: unknown) => 'https://cdn.example/from-sdk',
);
const mockRestUpload = jest.fn(async (_input?: unknown) => ({ uploaded: true }));

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
  buildGsUrl: (bucket: string, path: string) => `gs://${bucket}/${path}`,
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
    mockRestUpload.mockResolvedValue({ uploaded: true });
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

  it('falls back to gs:// URL when getDownloadURL fails', async () => {
    mockGetDownloadURL.mockRejectedValueOnce(new Error('no url'));

    const result = await uploadQuestionImage({
      uid: 'u1',
      localId: 'local-2',
      base64: 'YWJj',
    });

    expect(result.downloadUrl).toBe(
      'gs://cozbil-dev-f9583.firebasestorage.app/users/u1/uploads/local-2.jpg',
    );
  });
});

describe('uploadBytesViaStorageRest xhr', () => {
  it('POSTs media bytes then PATCHes custom metadata without download tokens', async () => {
    const real = jest.requireActual(
      '@/src/features/solve/storageRestUpload',
    ) as typeof import('@/src/features/solve/storageRestUpload');

    const bodies: unknown[] = [];
    const methods: string[] = [];
    const urls: string[] = [];
    let callIdx = 0;
    const xhrFactory = () => {
      const xhr = mockXhr(200);
      xhr.open = jest.fn((method: string, url: string) => {
        methods[callIdx] = method;
        urls[callIdx] = url;
      });
      xhr.send = jest.fn(function send(this: typeof xhr, body: unknown) {
        bodies[callIdx] = body;
        callIdx += 1;
        queueMicrotask(() => this.onload?.());
      });
      return xhr as unknown as XMLHttpRequest;
    };

    await real.uploadBytesViaStorageRest({
      bucket: 'bucket.appspot.com',
      path: 'users/u1/uploads/1.jpg',
      bytes: Uint8Array.from([1, 2, 3, 4]),
      contentType: 'image/jpeg',
      idToken: 'tok',
      customMetadata: {
        cozbilSolve: '1',
        firebaseStorageDownloadTokens: 'must-be-stripped',
      },
      xhrFactory,
    });

    expect(methods).toEqual(['POST', 'PATCH']);
    expect(urls[0]).toContain('uploadType=media');
    expect(bodies[0]).toBeInstanceOf(ArrayBuffer);
    const patchBody = String(bodies[1]);
    expect(patchBody).toContain('cozbilSolve');
    expect(patchBody).not.toContain('firebaseStorageDownloadTokens');
    expect(patchBody).not.toContain('must-be-stripped');
  });

  it('rejects on non-2xx media upload', async () => {
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
