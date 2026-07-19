import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import type { SolveQuestionRequest, SolveQuestionResponse } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

const SOLVE_TIMEOUT_MS = 55_000;

type SolveRequestDoc = {
  status: 'pending' | 'running' | 'done' | 'error';
  response?: SolveQuestionResponse;
  errorCode?: string;
  errorMessage?: string;
};

export type SolveViaFirestoreRequest = SolveQuestionRequest & {
  mimeType?: string;
  /** Must match Storage filename stem (users/{uid}/uploads/{requestId}.jpg). */
  requestId: string;
};

/**
 * Org-policy safe solve:
 * 1) Ensure pending doc at known id (Storage trigger writes the same id)
 * 2) Listen until done/error
 * Storage `onSolveUploadFinalized` is primary; Firestore create trigger is backup.
 */
export async function callSolveQuestionViaFirestore(
  request: SolveViaFirestoreRequest,
): Promise<SolveQuestionResponse> {
  const user = await ensureSignedIn();
  const { db } = getFirebase();
  const ref = doc(db, 'users', user.uid, 'solveRequests', request.requestId);

  const existing = await getDoc(ref);
  if (existing.exists()) {
    const data = existing.data() as SolveRequestDoc;
    if (data.status === 'done' && data.response) {
      return data.response;
    }
    if (data.status === 'error') {
      throw mapSolveDocError(data);
    }
  } else {
    const payload: Record<string, unknown> = {
      imagePath: request.imagePath,
      mimeType: request.mimeType ?? 'image/jpeg',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (request.examType) payload.examType = request.examType;
    if (request.subjectHint) payload.subjectHint = request.subjectHint;
    try {
      // Rules: create-only. If Storage trigger already wrote the doc, this fails.
      await setDoc(ref, payload);
    } catch (createErr) {
      const again = await getDoc(ref);
      if (!again.exists()) throw createErr;
      const data = again.data() as SolveRequestDoc;
      if (data.status === 'done' && data.response) return data.response;
      if (data.status === 'error') throw mapSolveDocError(data);
      // running/pending — fall through to listener
    }
  }

  return await new Promise<SolveQuestionResponse>((resolve, reject) => {
    let unsub: Unsubscribe | null = null;
    const timer = setTimeout(() => {
      unsub?.();
      reject(
        Object.assign(
          new Error(
            'SOLVE_TIMEOUT — Storage/Firestore trigger yanıt yazmadı. Mac’te: bash scripts/deploy-firestore-solve.sh',
          ),
          { code: 'functions/deadline-exceeded' },
        ),
      );
    }, SOLVE_TIMEOUT_MS);

    unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as SolveRequestDoc | undefined;
        if (!data) return;
        if (data.status === 'done' && data.response) {
          clearTimeout(timer);
          unsub?.();
          resolve(data.response);
          return;
        }
        if (data.status === 'error') {
          clearTimeout(timer);
          unsub?.();
          reject(mapSolveDocError(data));
        }
      },
      (err) => {
        clearTimeout(timer);
        unsub?.();
        reject(err);
      },
    );
  });
}

function mapSolveDocError(data: SolveRequestDoc): Error {
  const code =
    data.errorCode === 'resource-exhausted'
      ? 'functions/resource-exhausted'
      : data.errorCode === 'failed-precondition'
        ? 'functions/failed-precondition'
        : data.errorCode === 'invalid-argument'
          ? 'functions/invalid-argument'
          : 'functions/internal';
  return Object.assign(new Error(data.errorMessage ?? 'Çözüm üretilemedi'), { code });
}
