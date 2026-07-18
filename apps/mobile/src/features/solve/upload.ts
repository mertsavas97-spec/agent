import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebase } from '@/src/lib/firebase';
import { buildUploadPath } from './paths';

export async function uploadQuestionImage(input: {
  uid: string;
  localId: string;
  uri: string;
  mimeType?: string;
}): Promise<{ imagePath: string; downloadUrl: string }> {
  const { storage } = getFirebase();
  const imagePath = buildUploadPath(input.uid, input.localId);
  const response = await fetch(input.uri);
  const blob = await response.blob();
  const storageRef = ref(storage, imagePath);
  await uploadBytes(storageRef, blob, {
    contentType: input.mimeType ?? 'image/jpeg',
  });
  const downloadUrl = await getDownloadURL(storageRef);
  return { imagePath, downloadUrl };
}
