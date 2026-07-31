import { getDownloadURL, ref } from 'firebase/storage';

import { getFirebase } from '@/src/lib/firebase';

import { decodeBase64ToBytes, normalizeImageBase64, uriToBase64 } from './imageBase64';
import { buildUploadPath } from './paths';
import {
  buildTokenDownloadUrl,
  uploadBytesViaStorageRest,
} from './storageRestUpload';

/**
 * Upload a question image for the Firestore solve path.
 *
 * Do not use Firebase `uploadBytes` / `uploadString` on React Native — they
 * construct Blobs from ArrayBufferView and crash Hermes BlobManager.
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
  const { storage, auth } = getFirebase();
  const imagePath = buildUploadPath(input.uid, input.localId);
  const contentType = input.mimeType ?? 'image/jpeg';

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

  const user = auth.currentUser;
  if (!user) {
    throw Object.assign(new Error('AUTH_REQUIRED_FOR_UPLOAD'), {
      code: 'functions/unauthenticated',
    });
  }

  const bucket = storage.app.options.storageBucket;
  if (!bucket) {
    throw Object.assign(new Error('STORAGE_BUCKET_MISSING'), {
      code: 'functions/failed-precondition',
    });
  }

  const customMetadata: Record<string, string> = {
    cozbilSolve: '1',
  };
  if (input.examType) customMetadata.examType = input.examType;
  if (input.subjectHint) customMetadata.subjectHint = input.subjectHint;
  if (input.mimeType) customMetadata.mimeType = input.mimeType;

  const idToken = await user.getIdToken();
  const bytes = decodeBase64ToBytes(base64);

  const { downloadToken } = await uploadBytesViaStorageRest({
    bucket,
    path: imagePath,
    bytes,
    contentType,
    idToken,
    customMetadata,
  });

  try {
    const storageRef = ref(storage, imagePath);
    const downloadUrl = await getDownloadURL(storageRef);
    return { imagePath, downloadUrl };
  } catch {
    return {
      imagePath,
      downloadUrl: buildTokenDownloadUrl(bucket, imagePath, downloadToken),
    };
  }
}
