import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import type { ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

import type { OnboardingResult } from './OnboardingFlow';

export async function fetchOnboardingStatus(): Promise<{
  done: boolean;
  examType: ExamType | null;
}> {
  const user = await ensureSignedIn();
  const { db, functions } = getFirebase();
  const ensure = httpsCallable(functions, 'ensureUser');
  await ensure({});
  const snap = await getDoc(doc(db, 'users', user.uid));
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
