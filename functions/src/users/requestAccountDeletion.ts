import { FieldValue, getFirestore } from 'firebase-admin/firestore';

/**
 * MVP soft-delete: flag account for erasure. Actual purge is ops/backfill
 * (not immediate hard-delete in this slice).
 */
export async function requestAccountDeletionDocument(uid: string): Promise<{
  deleteRequested: true;
}> {
  await getFirestore()
    .collection('users')
    .doc(uid)
    .set(
      {
        deleteRequestedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  return { deleteRequested: true };
}
