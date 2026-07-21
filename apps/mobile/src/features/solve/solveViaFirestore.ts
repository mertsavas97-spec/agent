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

import { PENDING_STUCK_MS, SOLVE_TIMEOUT_MS } from './solveTiming';

/**
 * Live Vertex + Gen2 cold start often exceeds 30s (Vision + Gemini + retry).
 * Keep under Functions timeout (120s); surface error before silent hang.
 */
export { PENDING_STUCK_MS, SOLVE_TIMEOUT_MS } from './solveTiming';
/** Grace for Eventarc/Storage lag before declaring trigger missing. */

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
 * Listen on users/{uid}/solveRequests/{requestId} until done/error.
 * Storage `onSolveUploadFinalized` is primary; Firestore create is backup.
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
    // running / pending → listen below (do not overwrite — rules forbid update)
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
      // Create-only; if Storage trigger already wrote the doc, update is denied.
      await setDoc(ref, payload);
    } catch (createErr) {
      const again = await getDoc(ref);
      if (!again.exists()) throw createErr;
      const data = again.data() as SolveRequestDoc;
      if (data.status === 'done' && data.response) return data.response;
      if (data.status === 'error') throw mapSolveDocError(data);
    }
  }

  return await new Promise<SolveQuestionResponse>((resolve, reject) => {
    let unsub: Unsubscribe | null = null;
    let lastStatus: string | undefined = existing.exists()
      ? (existing.data() as SolveRequestDoc).status
      : 'pending';

    const fail = (err: Error) => {
      clearTimeout(hardTimer);
      clearTimeout(pendingTimer);
      unsub?.();
      reject(err);
    };

    const hardTimer = setTimeout(() => {
      fail(
        Object.assign(
          new Error(
            'SOLVE_TIMEOUT — sunucu tetikleyicisi yanıt yazmadı (onSolveUploadFinalized).',
          ),
          { code: 'functions/deadline-exceeded' },
        ),
      );
    }, SOLVE_TIMEOUT_MS);

    const pendingTimer = setTimeout(() => {
      if (lastStatus === 'pending') {
        fail(
          Object.assign(
            new Error(
              'SOLVE_TRIGGER_MISSING — istek pending kaldı; Functions deploy edilmemiş olabilir.',
            ),
            { code: 'functions/unavailable' },
          ),
        );
      }
    }, PENDING_STUCK_MS);

    unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as SolveRequestDoc | undefined;
        if (!data) return;
        lastStatus = data.status;
        if (data.status === 'running') {
          clearTimeout(pendingTimer);
        }
        if (data.status === 'done' && data.response) {
          clearTimeout(hardTimer);
          clearTimeout(pendingTimer);
          unsub?.();
          resolve(data.response);
          return;
        }
        if (data.status === 'error') {
          clearTimeout(hardTimer);
          clearTimeout(pendingTimer);
          unsub?.();
          reject(mapSolveDocError(data));
        }
      },
      (err) => {
        fail(err instanceof Error ? err : new Error(String(err)));
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
