import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/src/lib/firebase';

export async function callRequestAccountDeletion(): Promise<void> {
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'requestAccountDeletion');
  await callable({});
}
