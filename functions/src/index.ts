import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v1';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onObjectFinalized } from 'firebase-functions/v2/storage';

import { liveBackendLabel, runtimeModeLabel } from './config/runtime';
import {
  assertExplainRateLimit,
  createExplainGenerator,
  loadSolutionForExplain,
  persistFollowUp,
  runExplainAgain,
} from './solve/explainAgain';
import { executeSolvePipeline, SolvePipelineError } from './solve/executeSolve';
import { parseSolveUploadPath } from './solve/parseUploadPath';
import {
  processSolveRequest,
  storageObjectExists,
} from './solve/processSolveRequest';
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
 * Org-policy safe path (Gen2 — Gen1 cannot attach to Firestore eur3).
 * Named V2 because a failed Gen1 stub blocked same-name upgrade.
 * Prefer Storage finalize trigger when Eventarc/Firestore lag; this is backup.
 */
export const onSolveRequestCreatedV2 = onDocumentCreated(
  {
    document: 'users/{uid}/solveRequests/{requestId}',
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const uid = event.params.uid;
    const data = snap.data() ?? {};
    const imagePath = typeof data.imagePath === 'string' ? data.imagePath : '';
    if (!imagePath) return;

    // Upload may still be in flight if client creates the doc first.
    if (!(await storageObjectExists(imagePath))) {
      console.info('onSolveRequestCreatedV2: image not ready yet', { uid, imagePath });
      return;
    }

    await processSolveRequest({
      ref: snap.ref,
      uid,
      imagePath,
      examType: typeof data.examType === 'string' ? data.examType : undefined,
      mimeType: typeof data.mimeType === 'string' ? data.mimeType : undefined,
      subjectHint: typeof data.subjectHint === 'string' ? data.subjectHint : undefined,
      source: 'firestore',
    });
  },
);

/**
 * Primary org-policy safe path: Storage finalize is reliable on Gen2.
 * Object name users/{uid}/uploads/{localId}.jpg → solveRequests/{localId}.
 * Custom metadata: examType, subjectHint, mimeType, cozbilSolve=1.
 */
export const onSolveUploadFinalized = onObjectFinalized(
  {
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (event) => {
    const objectName = event.data.name;
    const parsed = parseSolveUploadPath(objectName);
    if (!parsed) return;

    const meta = event.data.metadata ?? {};
    // Only process uploads tagged by the mobile solve flow (ignore stray files).
    if (meta.cozbilSolve !== '1' && meta.cozbilSolve !== 'true') {
      console.info('onSolveUploadFinalized: skip untagged object', { objectName });
      return;
    }

    const ref = getFirestore()
      .collection('users')
      .doc(parsed.uid)
      .collection('solveRequests')
      .doc(parsed.localId);

    const mimeType =
      typeof meta.mimeType === 'string' && meta.mimeType
        ? meta.mimeType
        : event.data.contentType || 'image/jpeg';

    await processSolveRequest({
      ref,
      uid: parsed.uid,
      imagePath: parsed.imagePath,
      examType: typeof meta.examType === 'string' ? meta.examType : undefined,
      mimeType,
      subjectHint: typeof meta.subjectHint === 'string' ? meta.subjectHint : undefined,
      source: 'storage',
    });
  },
);

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
