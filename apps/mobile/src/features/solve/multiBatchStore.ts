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
}

export function takePendingMultiBatch(): MultiBatchPayload | null {
  const out = pending;
  pending = null;
  return out;
}

export function peekPendingMultiBatch(): MultiBatchPayload | null {
  return pending;
}

export function clearPendingMultiBatch(): void {
  pending = null;
}

/** Test helper */
export function __resetMultiBatchStoreForTests(): void {
  pending = null;
}
