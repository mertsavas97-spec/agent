import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import type { ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

import type { OnboardingResult } from './OnboardingFlow';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function fetchOnboardingStatus(): Promise<{
  done: boolean;
  examType: ExamType | null;
}> {
  const user = await withTimeout(ensureSignedIn(), 8000, 'AUTH');
  const { db, functions } = getFirebase();
  const ensure = httpsCallable(functions, 'ensureUser');
  await withTimeout(ensure({}), 8000, 'ENSURE_USER');
  const snap = await withTimeout(getDoc(doc(db, 'users', user.uid)), 8000, 'USER_DOC');
  if (!snap.exists()) return { done: false, examType: null };
  const data = snap.data();
  const examType =
    data.examType === 'lgs' || data.examType === 'ygs' || data.examType === 'kpss'
      ? data.examType
      : null;
  return {
    done: Boolean(data.onboardingCompletedAt),
    examType,
  };
}

export async function submitOnboarding(result: OnboardingResult): Promise<void> {
  await ensureSignedIn();
  const { functions } = getFirebase();
  const complete = httpsCallable(functions, 'completeOnboarding');
  await complete({
    examType: result.examType,
    ageBand: result.ageBand,
    parentalConsent: result.parentalConsent,
  });
}
