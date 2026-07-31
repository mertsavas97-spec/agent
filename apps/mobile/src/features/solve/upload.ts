import { getDownloadURL, ref, uploadString } from 'firebase/storage';

import { getFirebase } from '@/src/lib/firebase';

import { normalizeImageBase64, uriToBase64 } from './imageBase64';
import { buildUploadPath } from './paths';

/**
 * Upload a question image for the Firestore solve path.
 *
 * React Native cannot `new Blob([ArrayBuffer|Uint8Array])` (Hermes BlobManager).
 * Firebase `uploadBytes(Uint8Array)` hits that path and fails with:
 *   "Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported"
 * So we always upload base64 via `uploadString` (RN-safe).
 */
export async function uploadQuestionImage(input: {
  uid: string;
  localId: string;
  uri?: string;
  /** Prefer when camera URI cannot be re-fetched. */
  base64?: string;
  mimeType?: string;
  examType?: string;
  subjectHint?: string;
}): Promise<{ imagePath: string; downloadUrl: string }> {
  const { storage } = getFirebase();
  const imagePath = buildUploadPath(input.uid, input.localId);
  const storageRef = ref(storage, imagePath);

  let base64: string | null = null;
  if (input.base64) {
    base64 = normalizeImageBase64(input.base64);
  } else if (input.uri) {
    base64 = await uriToBase64(input.uri);
  }

  if (!base64) {
    throw Object.assign(new Error('UPLOAD_IMAGE_MISSING'), {
      code: 'functions/invalid-argument',
    });
  }

  const customMetadata: Record<string, string> = {
    cozbilSolve: '1',
  };
  if (input.examType) customMetadata.examType = input.examType;
  if (input.subjectHint) customMetadata.subjectHint = input.subjectHint;
  if (input.mimeType) customMetadata.mimeType = input.mimeType;

  await uploadString(storageRef, base64, 'base64', {
    contentType: input.mimeType ?? 'image/jpeg',
    customMetadata,
  });
  const downloadUrl = await getDownloadURL(storageRef);
  return { imagePath, downloadUrl };
}
