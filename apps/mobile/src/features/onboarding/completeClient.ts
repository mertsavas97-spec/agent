import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import {
  completeOnboardingLocal,
  ensureUserDocLocal,
  isExamType,
  resetOnboardingLocal,
} from '@/src/features/auth/userDocLocal';
import type { ExamType } from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

import type { OnboardingResult } from './OnboardingFlow';
import { markOnboardingComplete, requestOnboardingReplay } from './onboardingReplay';
import { writeExamPreference } from '@/src/features/exam/examPreference';

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

async function ensureUserPreferCallable(uid: string): Promise<void> {
  const { functions } = getFirebase();
  try {
    const ensure = httpsCallable(functions, 'ensureUser');
    await withTimeout(ensure({}), 5000, 'ENSURE_USER');
  } catch {
    // Org policy may block Cloud Functions invoker (allUsers). Firestore path works.
    await withTimeout(ensureUserDocLocal(uid), 8000, 'ENSURE_USER_LOCAL');
  }
}

export async function fetchOnboardingStatus(): Promise<{
  done: boolean;
  examType: ExamType | null;
}> {
  const user = await withTimeout(ensureSignedIn(), 8000, 'AUTH');
  await ensureUserPreferCallable(user.uid);
  const { db } = getFirebase();
  const snap = await withTimeout(getDoc(doc(db, 'users', user.uid)), 8000, 'USER_DOC');
  if (!snap.exists()) return { done: false, examType: null };
  const data = snap.data();
  const examType = isExamType(data.examType) ? data.examType : null;
  return {
    done: Boolean(data.onboardingCompletedAt),
    examType,
  };
}

export async function submitOnboarding(result: OnboardingResult): Promise<void> {
  const user = await ensureSignedIn();
  // Local preference first — home / settings read this immediately.
  await writeExamPreference(result.examType);
  const { functions } = getFirebase();
  try {
    const complete = httpsCallable(functions, 'completeOnboarding');
    await withTimeout(
      complete({
        examType: result.examType,
        ageBand: result.ageBand,
        parentalConsent: result.parentalConsent,
      }),
      8000,
      'COMPLETE_ONBOARDING',
    );
  } catch {
    await completeOnboardingLocal(user.uid, {
      examType: result.examType,
      ageBand: result.ageBand,
      parentalConsent: result.parentalConsent,
    });
  }
  // Unlock BootstrapGate before navigation (avoids stuck needs_onboarding race).
  markOnboardingComplete();
}

/**
 * Demo (kişisel telefon): onboarding’i sıfırla ve BootstrapGate’i yeniden yükle.
 * Store / prod UI’da kalıcı özellik değil — şimdilik Ayarlar’da.
 */
export async function replayOnboardingForDemo(): Promise<void> {
  const user = await withTimeout(ensureSignedIn(), 8000, 'AUTH');
  await withTimeout(resetOnboardingLocal(user.uid), 8000, 'RESET_ONBOARDING');
  requestOnboardingReplay();
}
