import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { isExamType } from '../theme/examTypes';
import type { ExamType, UserDoc } from '../types/contracts';

export type BootstrapInput = {
  uid: string;
  examType?: string;
  ageBand?: UserDoc['ageBand'];
  displayName?: string;
};

export function buildDefaultUserDoc(input: BootstrapInput): UserDoc {
  const examType: ExamType =
    input.examType && isExamType(input.examType) ? input.examType : 'lgs';

  return {
    displayName: input.displayName,
    examType,
    ageBand: input.ageBand,
    parentalConsentAt: null,
    streakCount: 0,
    streakLastActiveDate: null,
    dailySolveCount: 0,
    dailySolveDate: null,
    subscriptionStatus: 'free',
    invalidImageScore: 0,
    restrictedUntil: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/** Idempotent: creates users/{uid} if missing; returns existing otherwise. */
export async function ensureUserDocument(input: BootstrapInput): Promise<{
  created: boolean;
  examType: ExamType;
}> {
  const ref = getFirestore().collection('users').doc(input.uid);
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() as UserDoc;
    return { created: false, examType: data.examType };
  }
  const doc = buildDefaultUserDoc(input);
  await ref.set(doc);
  return { created: true, examType: doc.examType };
}
