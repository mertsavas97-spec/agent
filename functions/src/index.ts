import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v1';

import { isDemoAiMode, runtimeModeLabel } from './config/runtime';
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
import { completeOnboardingDocument } from './users/completeOnboarding';
import { isExamType } from './theme/examTypes';
import type { ExamType, Subject } from './types/contracts';

initializeApp();

/** Health check — Phase 1 scaffold. */
export const ping = functions.https.onRequest((_req, res) => {
  res.status(200).json({
    ok: true,
    app: 'cozbil',
    exams: ['lgs', 'ygs', 'kpss'],
    aiMode: runtimeModeLabel(),
  });
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

/** US3: persist examType + consent + onboardingCompletedAt */
export const completeOnboarding = functions.https.onCall(async (data, context) => {
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

/** US1: moderate → cache → Gemini → stepped solution */
export const solveQuestion = functions
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
    const userExam = userSnap.data()?.examType;
    const examTypeRaw =
      typeof data?.examType === 'string' ? data.examType : userExam;
    if (!examTypeRaw || !isExamType(examTypeRaw)) {
      throw new functions.https.HttpsError('failed-precondition', 'Sınav türü seçilmedi');
    }
    const examType = examTypeRaw as ExamType;

    try {
      if (isDemoAiMode()) {
        console.warn('solveQuestion running in DEMO AI mode (no Gemini credit required)');
      }
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
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        throw new functions.https.HttpsError('resource-exhausted', 'Günlük hak bitti');
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
export const listAttempts = functions.https.onCall(async (data, context) => {
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
export const getProgressSummary = functions.https.onCall(async (_data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  return getProgressSummaryForUser(context.auth.uid);
});

/** US2: simpler re-explanation — does not burn daily solve quota */
export const explainAgain = functions.https.onCall(async (data, context) => {
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
