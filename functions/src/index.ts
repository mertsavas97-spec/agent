import { initializeApp } from 'firebase-admin/app';
import * as functions from 'firebase-functions/v1';

import { ensureUserDocument } from './users/bootstrapUser';
import { isExamType } from './theme/examTypes';

initializeApp();

/** Health check — Phase 1 scaffold. */
export const ping = functions.https.onRequest((_req, res) => {
  res.status(200).json({ ok: true, app: 'cozbil', exams: ['lgs', 'ygs', 'kpss'] });
});

/** Creates users/{uid} defaults on first login (callable). */
export const ensureUser = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  const examType = typeof data?.examType === 'string' ? data.examType : undefined;
  if (examType && !isExamType(examType)) {
    throw new functions.https.HttpsError('invalid-argument', 'Geçersiz sınav türü');
  }
  const ageBand = data?.ageBand as 'under13' | '13to17' | '18plus' | undefined;
  return ensureUserDocument({
    uid: context.auth.uid,
    examType,
    ageBand,
    displayName: typeof data?.displayName === 'string' ? data.displayName : undefined,
  });
});
