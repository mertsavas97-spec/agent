/**
 * Client-side users/{uid} bootstrap when Cloud Functions IAM blocks callables
 * (org policy: allUsers invoker forbidden). Firestore rules allow owner create/update.
 */
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import type { ExamType } from '@/src/lib/api/types';
import { getFirebase } from '@/src/lib/firebase';

export type AgeBand = 'under13' | '13to17' | '18plus';

const EXAMS: ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'];

export function isExamType(v: unknown): v is ExamType {
  return v === 'lgs' || v === 'ygs' || v === 'kpss' || v === 'trafik';
}

/** Default profile fields matching firestore.rules create allow-list. */
export function buildLocalUserDoc(examType: ExamType = 'lgs') {
  return {
    examType,
    ageBand: null as AgeBand | null,
    parentalConsentAt: null,
    consentAcceptedAt: null,
    onboardingCompletedAt: null,
    streakCount: 0,
    streakLastActiveDate: null,
    dailySolveCount: 0,
    dailySolveDate: null,
    subscriptionStatus: 'free' as const,
    invalidImageScore: 0,
    restrictedUntil: null,
    deleteRequestedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** Idempotent: create users/{uid} if missing. */
export async function ensureUserDocLocal(uid: string, examType?: ExamType): Promise<{
  created: boolean;
  examType: ExamType;
}> {
  const { db } = getFirebase();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const et = snap.data()?.examType;
    return { created: false, examType: isExamType(et) ? et : 'lgs' };
  }
  const initial = examType && isExamType(examType) ? examType : 'lgs';
  await setDoc(ref, buildLocalUserDoc(initial));
  return { created: true, examType: initial };
}

export async function updateExamTypeLocal(uid: string, examType: ExamType): Promise<ExamType> {
  if (!EXAMS.includes(examType)) throw new Error('INVALID_EXAM');
  const { db } = getFirebase();
  const ref = doc(db, 'users', uid);
  await ensureUserDocLocal(uid, examType);
  await updateDoc(ref, { examType, updatedAt: serverTimestamp() });
  return examType;
}

export async function completeOnboardingLocal(
  uid: string,
  input: { examType: ExamType; ageBand?: AgeBand; parentalConsent: boolean },
): Promise<void> {
  if (!isExamType(input.examType)) throw new Error('INVALID_EXAM');
  const { db } = getFirebase();
  const ref = doc(db, 'users', uid);
  await ensureUserDocLocal(uid, input.examType);
  await updateDoc(ref, {
    examType: input.examType,
    ageBand: input.ageBand ?? null,
    parentalConsentAt: input.parentalConsent ? serverTimestamp() : null,
    consentAcceptedAt: serverTimestamp(),
    onboardingCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
