/**
 * uploadQuestionImage must use uploadString (base64), never uploadBytes(Uint8Array),
 * because RN BlobManager rejects ArrayBufferView → Blob conversion.
 */
jest.mock('firebase/storage', () => ({
  ref: jest.fn((_storage: unknown, path: string) => ({ path })),
  uploadString: jest.fn(async () => undefined),
  uploadBytes: jest.fn(async () => {
    throw new Error('uploadBytes must not be used on RN');
  }),
  getDownloadURL: jest.fn(async (r: { path: string }) => `https://example.test/${r.path}`),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({ storage: { name: 'mock-storage' } }),
}));

jest.mock('@/src/features/solve/imageBase64', () => ({
  normalizeImageBase64: (s: string) => s.replace(/^data:[^;]+;base64,/i, ''),
  uriToBase64: jest.fn(async () => 'dGVzdA=='),
}));

import { uploadBytes, uploadString } from 'firebase/storage';

import { uriToBase64 } from '@/src/features/solve/imageBase64';
import { uploadQuestionImage } from '@/src/features/solve/upload';

describe('uploadQuestionImage (RN-safe)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads base64 via uploadString, not uploadBytes', async () => {
    const result = await uploadQuestionImage({
      uid: 'u1',
      localId: 'local-1',
      base64: 'data:image/jpeg;base64,YWJj',
      mimeType: 'image/jpeg',
      examType: 'lgs',
    });

    expect(uploadString).toHaveBeenCalledTimes(1);
    expect(uploadString).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining('u1') }),
      'YWJj',
      'base64',
      expect.objectContaining({
        contentType: 'image/jpeg',
        customMetadata: expect.objectContaining({
          cozbilSolve: '1',
          examType: 'lgs',
        }),
      }),
    );
    expect(uploadBytes).not.toHaveBeenCalled();
    expect(result.downloadUrl).toContain('u1');
    expect(result.imagePath).toContain('u1');
  });

  it('falls back to uriToBase64 when only uri is provided', async () => {
    await uploadQuestionImage({
      uid: 'u2',
      localId: 'local-2',
      uri: 'file:///tmp/q.jpg',
    });

    expect(uriToBase64).toHaveBeenCalledWith('file:///tmp/q.jpg');
    expect(uploadString).toHaveBeenCalledWith(
      expect.any(Object),
      'dGVzdA==',
      'base64',
      expect.any(Object),
    );
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it('rejects when neither base64 nor uri yields data', async () => {
    (uriToBase64 as jest.Mock).mockResolvedValueOnce(null);
    await expect(
      uploadQuestionImage({ uid: 'u3', localId: 'x', uri: 'file:///missing' }),
    ).rejects.toMatchObject({ code: 'functions/invalid-argument' });
  });
});
