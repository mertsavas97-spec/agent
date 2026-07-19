import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebase } from '@/src/lib/firebase';
import { buildUploadPath } from './paths';

export async function uploadQuestionImage(input: {
  uid: string;
  localId: string;
  uri: string;
  mimeType?: string;
  examType?: string;
  subjectHint?: string;
}): Promise<{ imagePath: string; downloadUrl: string }> {
  const { storage } = getFirebase();
  const imagePath = buildUploadPath(input.uid, input.localId);
  const response = await fetch(input.uri);
  const blob = await response.blob();
  const storageRef = ref(storage, imagePath);

  const customMetadata: Record<string, string> = {
    cozbilSolve: '1',
  };
  if (input.examType) customMetadata.examType = input.examType;
  if (input.subjectHint) customMetadata.subjectHint = input.subjectHint;
  if (input.mimeType) customMetadata.mimeType = input.mimeType;

  await uploadBytes(storageRef, blob, {
    contentType: input.mimeType ?? 'image/jpeg',
    customMetadata,
  });
  const downloadUrl = await getDownloadURL(storageRef);
  return { imagePath, downloadUrl };
}
