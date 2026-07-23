/**
 * Hard purge after soft-delete flag — Auth + Firestore + Storage cascade.
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const USER_SUBCOLLECTIONS = [
  'attempts',
  'solutions',
  'solveRequests',
  'followUps',
] as const;

export type PurgeAccountDeps = {
  requireDeleteFlag?: boolean;
  listSubcollectionDocIds: (
    uid: string,
    sub: (typeof USER_SUBCOLLECTIONS)[number],
  ) => Promise<string[]>;
  deleteSubcollectionDoc: (
    uid: string,
    sub: (typeof USER_SUBCOLLECTIONS)[number],
    id: string,
  ) => Promise<void>;
  deleteUserDoc: (uid: string) => Promise<void>;
  deleteStoragePrefix: (prefix: string) => Promise<void>;
  deleteAuthUser: (uid: string) => Promise<void>;
  readDeleteRequested: (uid: string) => Promise<boolean>;
};

export type PurgeAccountResult = {
  purged: boolean;
  reason?: 'ok' | 'delete_not_requested' | 'already_gone';
  deletedDocs: number;
};

export async function purgeAccountData(
  uid: string,
  deps: PurgeAccountDeps,
): Promise<PurgeAccountResult> {
  if (deps.requireDeleteFlag !== false) {
    const flagged = await deps.readDeleteRequested(uid);
    if (!flagged) {
      return { purged: false, reason: 'delete_not_requested', deletedDocs: 0 };
    }
  }

  let deletedDocs = 0;
  for (const sub of USER_SUBCOLLECTIONS) {
    const ids = await deps.listSubcollectionDocIds(uid, sub);
    for (const id of ids) {
      await deps.deleteSubcollectionDoc(uid, sub, id);
      deletedDocs += 1;
    }
  }

  await deps.deleteStoragePrefix(`users/${uid}/`);
  await deps.deleteUserDoc(uid);
  deletedDocs += 1;

  try {
    await deps.deleteAuthUser(uid);
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : '';
    if (code !== 'auth/user-not-found') {
      throw err;
    }
  }

  return { purged: true, reason: 'ok', deletedDocs };
}

export function createAdminPurgeDeps(): PurgeAccountDeps {
  const db = getFirestore();
  const bucket = getStorage().bucket();
  const auth = getAuth();

  return {
    requireDeleteFlag: true,
    async readDeleteRequested(uid) {
      const snap = await db.collection('users').doc(uid).get();
      if (!snap.exists) return false;
      return Boolean(snap.data()?.deleteRequestedAt);
    },
    async listSubcollectionDocIds(uid, sub) {
      const snap = await db.collection('users').doc(uid).collection(sub).listDocuments();
      return snap.map((d) => d.id);
    },
    async deleteSubcollectionDoc(uid, sub, id) {
      await db.collection('users').doc(uid).collection(sub).doc(id).delete();
    },
    async deleteUserDoc(uid) {
      await db.collection('users').doc(uid).delete();
    },
    async deleteStoragePrefix(prefix) {
      try {
        await bucket.deleteFiles({ prefix, force: true });
      } catch {
        /* empty prefix / missing objects */
      }
    },
    async deleteAuthUser(uid) {
      await auth.deleteUser(uid);
    },
  };
}

export async function purgeAccountForUser(uid: string): Promise<PurgeAccountResult> {
  return purgeAccountData(uid, createAdminPurgeDeps());
}
