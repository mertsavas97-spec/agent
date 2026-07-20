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
import {
  readOnboardingDoneLocal,
  writeOnboardingDoneLocal,
} from './onboardingPreference';
import { markOnboardingComplete, requestOnboardingReplay } from './onboardingReplay';
import { readExamPreference, writeExamPreference } from '@/src/features/exam/examPreference';

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
  const localDone = await readOnboardingDoneLocal();
  const localExam = await readExamPreference();

  try {
    const user = await withTimeout(ensureSignedIn(), 8000, 'AUTH');
    await ensureUserPreferCallable(user.uid);
    const { db } = getFirebase();
    const snap = await withTimeout(getDoc(doc(db, 'users', user.uid)), 8000, 'USER_DOC');
    if (!snap.exists()) {
      return { done: localDone, examType: localExam };
    }
    const data = snap.data();
    const examType = isExamType(data.examType) ? data.examType : localExam;
    return {
      done: Boolean(data.onboardingCompletedAt) || localDone,
      examType,
    };
  } catch {
    // Offline / Auth flaky — local preference is enough for dogfood.
    return { done: localDone, examType: localExam };
  }
}

async function syncOnboardingCallable(result: OnboardingResult): Promise<void> {
  const { functions } = getFirebase();
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
}

async function persistOnboardingRemote(result: OnboardingResult): Promise<void> {
  const user = await withTimeout(ensureSignedIn(), 10_000, 'AUTH');
  await withTimeout(ensureUserDocLocal(user.uid, result.examType), 10_000, 'ENSURE_USER_LOCAL');
  await withTimeout(
    completeOnboardingLocal(user.uid, {
      examType: result.examType,
      ageBand: result.ageBand,
      parentalConsent: result.parentalConsent,
    }),
    10_000,
    'COMPLETE_ONBOARDING_LOCAL',
  );
}

/**
 * Persist onboarding — local preference first (always unlocks), Firestore best-effort.
 * Phone dogfood must not block on Auth/Firestore timeouts.
 */
export async function submitOnboarding(result: OnboardingResult): Promise<void> {
  await writeExamPreference(result.examType);
  await writeOnboardingDoneLocal(true);

  try {
    await persistOnboardingRemote(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[onboarding] remote persist failed; continuing with local unlock (${msg})`);
  }

  markOnboardingComplete();

  void syncOnboardingCallable(result).catch(() => undefined);
}

/**
 * Demo (kişisel telefon): onboarding’i sıfırla ve BootstrapGate’i yeniden yükle.
 * Store / prod UI’da kalıcı özellik değil — şimdilik Ayarlar’da.
 */
export async function replayOnboardingForDemo(): Promise<void> {
  await writeOnboardingDoneLocal(false);
  try {
    const user = await withTimeout(ensureSignedIn(), 8000, 'AUTH');
    await withTimeout(resetOnboardingLocal(user.uid), 8000, 'RESET_ONBOARDING');
  } catch (err) {
    console.warn('[onboarding] remote reset failed; local flag cleared', err);
  }
  requestOnboardingReplay();
}
