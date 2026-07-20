import type { ExamType, Subject } from '@/src/lib/api/types';

import type { PickedImage } from './image';
import { MULTI_BATCH_MAX } from './multiBatchPolicy';

export type MultiBatchPayload = {
  images: PickedImage[];
  subjectHint?: Exclude<Subject, 'unknown'>;
  examType?: ExamType;
  createdAt: number;
};

let pending: MultiBatchPayload | null = null;
/** Survives React Strict Mode remount so workers are not cancelled mid-flight. */
let claimed: MultiBatchPayload | null = null;

export function setPendingMultiBatch(input: {
  images: PickedImage[];
  subjectHint?: Exclude<Subject, 'unknown'>;
  examType?: ExamType;
}): void {
  const images = input.images.slice(0, MULTI_BATCH_MAX);
  if (images.length === 0) {
    pending = null;
    return;
  }
  pending = {
    images,
    subjectHint: input.subjectHint,
    examType: input.examType,
    createdAt: Date.now(),
  };
  claimed = null;
}

/**
 * Claim pending batch for solve-batch. Re-entrant: returns the same claim
 * if effect remounts before release (React Strict Mode).
 */
export function takePendingMultiBatch(): MultiBatchPayload | null {
  if (pending) {
    claimed = pending;
    pending = null;
  }
  return claimed;
}

export function peekPendingMultiBatch(): MultiBatchPayload | null {
  return pending ?? claimed;
}

export function clearPendingMultiBatch(): void {
  pending = null;
  claimed = null;
}

/** Call when batch solve screen finishes or unmounts after completion. */
export function releaseClaimedMultiBatch(): void {
  claimed = null;
}

/** Test helper */
export function __resetMultiBatchStoreForTests(): void {
  pending = null;
  claimed = null;
}
