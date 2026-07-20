import type { Subject } from '@/src/lib/api/types';

/** In-session ders ipucu (Konular filtresi → solve). Process memory only. */
let pendingSubjectHint: Exclude<Subject, 'unknown'> | null = null;

export function setPendingSubjectHint(subject: Exclude<Subject, 'unknown'> | null): void {
  pendingSubjectHint = subject;
}

export function takePendingSubjectHint(): Exclude<Subject, 'unknown'> | null {
  const v = pendingSubjectHint;
  pendingSubjectHint = null;
  return v;
}

export function peekPendingSubjectHint(): Exclude<Subject, 'unknown'> | null {
  return pendingSubjectHint;
}
