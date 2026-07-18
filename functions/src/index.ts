import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v1';

import { liveBackendLabel, runtimeModeLabel } from './config/runtime';
import { createFirestoreCache, downloadImageBuffer, loadQuota, persistRejected, persistSolved } from './solve/firestoreAdapters';
import {
  assertExplainRateLimit,
  createExplainGenerator,
  loadSolutionForExplain,
  persistFollowUp,
  runExplainAgain,
} from './solve/explainAgain';
import { createGeminiSolver } from './solve/geminiSolve';
import { runSolveQuestion } from './solve/solveQuestion';
import { createVisionClient } from './moderation/visionClient';
import { getProgressSummaryForUser } from './progress/getProgressSummary';
import { listAttemptsForUser } from './progress/listAttempts';
import { ensureUserDocument } from './users/bootstrapUser';
import {
  INVALID_RESTRICT_THRESHOLD,
  isTemporarilyRestricted,
  restrictionAfterScore,
} from './abuse/invalidImageScore';
import { assertRateLimit } from './abuse/rateLimit';
import { completeOnboardingDocument } from './users/completeOnboarding';
import { requestAccountDeletionDocument } from './users/requestAccountDeletion';
import { updateExamTypeDocument } from './users/updateExamType';
import { isExamType } from './theme/examTypes';
import type { ExamType, Subject } from './types/contracts';

initializeApp();

/** Align with mobile `getFunctions(app, 'europe-west1')`. */
const regional = functions.region('europe-west1');

/** Health check — Phase 1 scaffold. */
export const ping = regional.https.onRequest((_req, res) => {
  res.status(200).json({
    ok: true,
    app: 'cozbil',
    exams: ['lgs', 'ygs', 'kpss'],
    aiMode: runtimeModeLabel(),
    aiBackend: liveBackendLabel(),
    projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT_ID || null,
  });
});

/** Creates users/{uid} defaults on first login (callable). */
export const ensureUser = regional.https.onCall(async (data, context) => {
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

/** US3: persist examType + consent + onboardingCompletedAt */
export const completeOnboarding = regional.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  const examType = typeof data?.examType === 'string' ? data.examType : '';
  try {
    return await completeOnboardingDocument({
      uid: context.auth.uid,
      examType,
      ageBand: data?.ageBand as 'under13' | '13to17' | '18plus' | undefined,
      parentalConsent: Boolean(data?.parentalConsent),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'InvalidExamError') {
      throw new functions.https.HttpsError('invalid-argument', 'Geçersiz sınav türü');
    }
    throw err;
  }
});

/** US7: mid-app exam mode switch (LGS ↔ YGS ↔ KPSS) */
export const updateExamType = regional.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  const examType = typeof data?.examType === 'string' ? data.examType : '';
  try {
    return await updateExamTypeDocument({ uid: context.auth.uid, examType });
  } catch (err) {
    if (err instanceof Error && err.name === 'InvalidExamError') {
      throw new functions.https.HttpsError('invalid-argument', 'Geçersiz sınav türü');
    }
    throw err;
  }
});

/** US7: soft-delete / KVKK erasure request flag */
export const requestAccountDeletion = regional.https.onCall(async (_data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  return requestAccountDeletionDocument(context.auth.uid);
});

/** US1: moderate → cache → Gemini (Vertex) → stepped solution */
export const solveQuestion = regional
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
    }
    const imagePath = typeof data?.imagePath === 'string' ? data.imagePath : '';
    if (!imagePath.startsWith(`users/${context.auth.uid}/`)) {
      throw new functions.https.HttpsError('invalid-argument', 'Geçersiz görsel yolu');
    }

    const userSnap = await getFirestore().collection('users').doc(context.auth.uid).get();
    const userData = userSnap.data() ?? {};
    const userExam = userData.examType;
    const examTypeRaw =
      typeof data?.examType === 'string' ? data.examType : userExam;
    if (!examTypeRaw || !isExamType(examTypeRaw)) {
      throw new functions.https.HttpsError('failed-precondition', 'Sınav türü seçilmedi');
    }
    const examType = examTypeRaw as ExamType;

    try {
      assertRateLimit(`solve:${context.auth.uid}`);
      const invalidScore = Number(userData.invalidImageScore ?? 0);
      const restrictedUntil =
        typeof userData.restrictedUntil === 'number' ? userData.restrictedUntil : null;
      if (isTemporarilyRestricted({ invalidImageScore: invalidScore, restrictedUntil })) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Geçici kısıtlama — biraz sonra tekrar dene',
        );
      }
      // Persist soft-restrict window when score already over threshold (from prior rejects)
      if (invalidScore >= INVALID_RESTRICT_THRESHOLD && restrictedUntil == null) {
        const next = restrictionAfterScore(invalidScore);
        await getFirestore()
          .collection('users')
          .doc(context.auth.uid)
          .set(
            { restrictedUntil: next.restrictedUntil, updatedAt: FieldValue.serverTimestamp() },
            { merge: true },
          );
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Geçici kısıtlama — biraz sonra tekrar dene',
        );
      }

      console.info('solveQuestion aiBackend', liveBackendLabel());
      const imageBuffer = await downloadImageBuffer(imagePath);
      return await runSolveQuestion(
        {
          uid: context.auth.uid,
          imagePath,
          imageBuffer,
          examType,
          mimeType: typeof data?.mimeType === 'string' ? data.mimeType : 'image/jpeg',
        },
        {
          vision: createVisionClient(),
          solver: createGeminiSolver(),
          cache: createFirestoreCache(),
          loadQuota,
          persistSolved,
          persistRejected,
        },
      );
    } catch (err) {
      if (err instanceof functions.https.HttpsError) throw err;
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        throw new functions.https.HttpsError('resource-exhausted', 'Günlük hak bitti');
      }
      if (err instanceof Error && err.name === 'RateLimitError') {
        throw new functions.https.HttpsError('resource-exhausted', 'Çok hızlı istek — biraz bekle');
      }
      console.error('solveQuestion failed', {
        uid: context.auth.uid,
        imagePath,
        message: err instanceof Error ? err.message : 'unknown',
      });
      throw new functions.https.HttpsError('internal', 'Çözüm şu an üretilemedi');
    }
  });

/** US4: history list */
export const listAttempts = regional.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  const subject = data?.subject as Subject | undefined;
  const topicId = typeof data?.topicId === 'string' ? data.topicId : undefined;
  const limit = typeof data?.limit === 'number' ? data.limit : undefined;
  const cursor = typeof data?.cursor === 'string' ? data.cursor : null;
  return listAttemptsForUser(context.auth.uid, { subject, topicId, limit, cursor });
});

/** US5: progress summary */
export const getProgressSummary = regional.https.onCall(async (_data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  return getProgressSummaryForUser(context.auth.uid);
});

/** US2: simpler re-explanation — does not burn daily solve quota */
export const explainAgain = regional.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  const solutionId = typeof data?.solutionId === 'string' ? data.solutionId : '';
  if (!solutionId) {
    throw new functions.https.HttpsError('invalid-argument', 'solutionId gerekli');
  }

  try {
    return await runExplainAgain(
      { uid: context.auth.uid, solutionId },
      {
        assertExplainAllowed: assertExplainRateLimit,
        loadSolution: loadSolutionForExplain,
        generate: createExplainGenerator(),
        persistFollowUp,
      },
    );
  } catch (err) {
    if (err instanceof Error && err.name === 'RateLimitError') {
      throw new functions.https.HttpsError('resource-exhausted', 'Çok hızlı istek');
    }
    if (err instanceof Error && err.name === 'NotFoundError') {
      throw new functions.https.HttpsError('not-found', 'Çözüm bulunamadı');
    }
    console.error('explainAgain failed', {
      uid: context.auth.uid,
      solutionId,
      message: err instanceof Error ? err.message : 'unknown',
    });
    throw new functions.https.HttpsError('internal', 'Açıklama üretilemedi');
  }
});
