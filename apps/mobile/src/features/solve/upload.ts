import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebase } from '@/src/lib/firebase';

import { decodeBase64ToBytes } from './imageBase64';
import { buildUploadPath } from './paths';

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

  let payload: Blob | Uint8Array;
  if (input.base64) {
    payload = decodeBase64ToBytes(input.base64);
  } else if (input.uri) {
    const response = await fetch(input.uri);
    payload = await response.blob();
  } else {
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

  await uploadBytes(storageRef, payload, {
    contentType: input.mimeType ?? 'image/jpeg',
    customMetadata,
  });
  const downloadUrl = await getDownloadURL(storageRef);
  return { imagePath, downloadUrl };
}
