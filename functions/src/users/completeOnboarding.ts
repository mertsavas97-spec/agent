import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { isExamType } from '../theme/examTypes';
import type { ExamType, UserDoc } from '../types/contracts';
import { buildDefaultUserDoc } from './bootstrapUser';

export type CompleteOnboardingInput = {
  uid: string;
  examType: string;
  ageBand?: UserDoc['ageBand'];
  parentalConsent?: boolean;
};

export async function completeOnboardingDocument(
  input: CompleteOnboardingInput,
): Promise<{ examType: ExamType; onboardingCompleted: true }> {
  if (!isExamType(input.examType)) {
    const err = new Error('INVALID_EXAM');
    err.name = 'InvalidExamError';
    throw err;
  }
  const examType = input.examType;
  const ref = getFirestore().collection('users').doc(input.uid);
  const snap = await ref.get();

  const parentalConsentAt =
    input.parentalConsent === true ? FieldValue.serverTimestamp() : null;
  const consentAcceptedAt = FieldValue.serverTimestamp();

  if (!snap.exists) {
    const base = buildDefaultUserDoc({
      uid: input.uid,
      examType,
      ageBand: input.ageBand,
    });
    await ref.set({
      ...base,
      examType,
      ageBand: input.ageBand,
      parentalConsentAt,
      consentAcceptedAt,
      onboardingCompletedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.set(
      {
        examType,
        ageBand: input.ageBand ?? snap.data()?.ageBand,
        parentalConsentAt,
        consentAcceptedAt,
        onboardingCompletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  return { examType, onboardingCompleted: true };
}
