import { initializeApp } from 'firebase-admin/app';
import { FieldValue } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v1';

import { liveBackendLabel, runtimeModeLabel } from './config/runtime';
import {
  assertExplainRateLimit,
  createExplainGenerator,
  loadSolutionForExplain,
  persistFollowUp,
  runExplainAgain,
} from './solve/explainAgain';
import { executeSolvePipeline, SolvePipelineError } from './solve/executeSolve';
import { getProgressSummaryForUser } from './progress/getProgressSummary';
import { listAttemptsForUser } from './progress/listAttempts';
import { ensureUserDocument } from './users/bootstrapUser';
import { completeOnboardingDocument } from './users/completeOnboarding';
import { requestAccountDeletionDocument } from './users/requestAccountDeletion';
import { updateExamTypeDocument } from './users/updateExamType';
import { isExamType } from './theme/examTypes';
import type { Subject } from './types/contracts';

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

/** US1: moderate → cache → Gemini (Vertex) → stepped solution (HTTP callable) */
export const solveQuestion = regional
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
    }
    try {
      return await executeSolvePipeline({
        uid: context.auth.uid,
        imagePath: typeof data?.imagePath === 'string' ? data.imagePath : '',
        examType: typeof data?.examType === 'string' ? data.examType : undefined,
        mimeType: typeof data?.mimeType === 'string' ? data.mimeType : undefined,
        subjectHint: typeof data?.subjectHint === 'string' ? data.subjectHint : undefined,
      });
    } catch (err) {
      if (err instanceof SolvePipelineError) {
        throw new functions.https.HttpsError(err.code, err.message);
      }
      console.error('solveQuestion failed', {
        uid: context.auth.uid,
        message: err instanceof Error ? err.message : 'unknown',
      });
      throw new functions.https.HttpsError('internal', 'Çözüm şu an üretilemedi');
    }
  });

/**
 * Org-policy safe path: no public HTTP invoker.
 * Mobile writes users/{uid}/solveRequests/{id} → this trigger runs Admin SDK.
 */
export const onSolveRequestCreated = regional
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .firestore.document('users/{uid}/solveRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const uid = context.params.uid;
    const data = snap.data() ?? {};
    const ref = snap.ref;

    await ref.set(
      { status: 'running', updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    try {
      const response = await executeSolvePipeline({
        uid,
        imagePath: typeof data.imagePath === 'string' ? data.imagePath : '',
        examType: typeof data.examType === 'string' ? data.examType : undefined,
        mimeType: typeof data.mimeType === 'string' ? data.mimeType : undefined,
        subjectHint: typeof data.subjectHint === 'string' ? data.subjectHint : undefined,
      });
      await ref.set(
        {
          status: 'done',
          response,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      const code = err instanceof SolvePipelineError ? err.code : 'internal';
      const message =
        err instanceof SolvePipelineError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Çözüm şu an üretilemedi';
      console.error('onSolveRequestCreated failed', { uid, code, message });
      await ref.set(
        {
          status: 'error',
          errorCode: code,
          errorMessage: message,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
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
