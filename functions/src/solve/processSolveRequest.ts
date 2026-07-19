import { FieldValue, getFirestore, type DocumentReference } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { executeSolvePipeline, SolvePipelineError, type SolvePipelineInput } from './executeSolve';

export type ClaimResult = 'claimed' | 'skip';

/** Pure claim gate — used by both Storage and Firestore triggers. */
export function decideClaim(status: string | undefined): ClaimResult {
  if (status === 'running' || status === 'done' || status === 'error') {
    return 'skip';
  }
  return 'claimed';
}

/**
 * Atomically claim a solve request (pending → running).
 * Skips if already running/done/error.
 */
export async function claimSolveRequest(
  ref: DocumentReference,
  seed: Record<string, unknown>,
): Promise<ClaimResult> {
  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const status = snap.exists ? (snap.data()?.status as string | undefined) : undefined;
    if (decideClaim(status) === 'skip') {
      return 'skip';
    }
    tx.set(
      ref,
      {
        ...seed,
        status: 'running',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return 'claimed';
  });
}

export async function storageObjectExists(imagePath: string): Promise<boolean> {
  try {
    const bucket = getStorage().bucket();
    const [exists] = await bucket.file(imagePath).exists();
    return exists;
  } catch {
    return false;
  }
}

export async function writeSolveSuccess(
  ref: DocumentReference,
  response: unknown,
): Promise<void> {
  await ref.set(
    {
      status: 'done',
      response,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function writeSolveError(ref: DocumentReference, err: unknown): Promise<void> {
  const code = err instanceof SolvePipelineError ? err.code : 'internal';
  const message =
    err instanceof SolvePipelineError
      ? err.message
      : err instanceof Error
        ? err.message
        : 'Çözüm şu an üretilemedi';
  await ref.set(
    {
      status: 'error',
      errorCode: code,
      errorMessage: message,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Claim → run pipeline → write done/error.
 * Returns whether this invocation performed work.
 */
export async function processSolveRequest(input: {
  ref: DocumentReference;
  uid: string;
  imagePath: string;
  examType?: string;
  mimeType?: string;
  subjectHint?: string;
  source: 'firestore' | 'storage';
}): Promise<'done' | 'skip' | 'error'> {
  const seed: Record<string, unknown> = {
    imagePath: input.imagePath,
    mimeType: input.mimeType ?? 'image/jpeg',
    source: input.source,
  };
  if (input.examType) seed.examType = input.examType;
  if (input.subjectHint) seed.subjectHint = input.subjectHint;

  const claim = await claimSolveRequest(input.ref, seed);
  if (claim === 'skip') return 'skip';

  const pipelineInput: SolvePipelineInput = {
    uid: input.uid,
    imagePath: input.imagePath,
    examType: input.examType,
    mimeType: input.mimeType,
    subjectHint: input.subjectHint,
  };

  try {
    const response = await executeSolvePipeline(pipelineInput);
    await writeSolveSuccess(input.ref, response);
    return 'done';
  } catch (err) {
    console.error('processSolveRequest failed', {
      uid: input.uid,
      source: input.source,
      message: err instanceof Error ? err.message : 'unknown',
    });
    await writeSolveError(input.ref, err);
    return 'error';
  }
}
