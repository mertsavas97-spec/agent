import {
  collection,
  doc,
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

/**
 * Org-policy safe solve: write Firestore request → background function → listen.
 * Does not need Cloud Functions HTTP invoker (allUsers blocked).
 */
export async function callSolveQuestionViaFirestore(
  request: SolveQuestionRequest & { mimeType?: string },
): Promise<SolveQuestionResponse> {
  const user = await ensureSignedIn();
  const { db } = getFirebase();
  const ref = doc(collection(db, 'users', user.uid, 'solveRequests'));

  const payload: Record<string, unknown> = {
    imagePath: request.imagePath,
    mimeType: request.mimeType ?? 'image/jpeg',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (request.examType) payload.examType = request.examType;
  if (request.subjectHint) payload.subjectHint = request.subjectHint;

  await setDoc(ref, payload);

  return await new Promise<SolveQuestionResponse>((resolve, reject) => {
    let unsub: Unsubscribe | null = null;
    const timer = setTimeout(() => {
      unsub?.();
      reject(Object.assign(new Error('SOLVE_TIMEOUT'), { code: 'functions/deadline-exceeded' }));
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
          const code =
            data.errorCode === 'resource-exhausted'
              ? 'functions/resource-exhausted'
              : data.errorCode === 'failed-precondition'
                ? 'functions/failed-precondition'
                : data.errorCode === 'invalid-argument'
                  ? 'functions/invalid-argument'
                  : 'functions/internal';
          reject(
            Object.assign(new Error(data.errorMessage ?? 'Çözüm üretilemedi'), {
              code,
            }),
          );
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
