import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v1';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onObjectFinalized } from 'firebase-functions/v2/storage';

import { hasVisionKey, liveBackendLabel, runtimeModeLabel } from './config/runtime';
import { useVertexAi } from './ai/vertexClient';
import {
  assertExplainRateLimit,
  createExplainGenerator,
  loadSolutionForExplain,
  persistFollowUp,
  runExplainAgain,
} from './solve/explainAgain';
import { executeSolvePipeline, SolvePipelineError } from './solve/executeSolve';
import { parseSolveUploadPath } from './solve/parseUploadPath';
import { isSolveTaggedUpload, metaValue } from './solve/solveUploadMeta';
import {
  processSolveRequest,
  storageObjectExists,
} from './solve/processSolveRequest';
import { getProgressSummaryForUser } from './progress/getProgressSummary';
import { listAttemptsForUser } from './progress/listAttempts';
import { ensureUserDocument } from './users/bootstrapUser';
import { completeOnboardingDocument } from './users/completeOnboarding';
import { requestAccountDeletionDocument } from './users/requestAccountDeletion';
import { purgeAccountForUser } from './users/purgeAccount';
import { updateExamTypeDocument } from './users/updateExamType';
import { grantRewardedSolveForUser } from './quota/grantRewardedSolve';
import { assertRateLimit } from './abuse/rateLimit';
import { syncSubscriptionForUser } from './subscription/syncSubscription';
import { isExamType } from './theme/examTypes';
import type { Subject } from './types/contracts';

initializeApp();

/** Align with mobile `getFunctions(app, 'europe-west1')`. */
const regional = functions.region('europe-west1');

/** Health check — Phase 1 scaffold. */
export const ping = regional.https.onRequest((_req, res) => {
  const visionBackend = hasVisionKey()
    ? 'api_key'
    : useVertexAi()
      ? 'adc'
      : runtimeModeLabel() === 'demo'
        ? 'stub'
        : 'missing';
  res.status(200).json({
    ok: true,
    app: 'cozbil',
    exams: ['lgs', 'ygs', 'kpss', 'trafik'],
    aiMode: runtimeModeLabel(),
    aiBackend: liveBackendLabel(),
    visionBackend,
    vertex: useVertexAi(),
    vertexLocation: process.env.VERTEX_LOCATION || 'us-central1',
    vertexModel: process.env.VERTEX_MODEL || 'gemini-2.5-flash',
    projectId:
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      null,
    billingNote: useVertexAi()
      ? 'Gemini+Vision → linked GCP billing (Startup credits)'
      : null,
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

/**
 * Hard purge after soft-delete flag — deletes Auth user, user doc,
 * subcollections, and Storage uploads under users/{uid}/.
 */
export const purgeAccount = regional
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(async (_data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
    }
    try {
      assertRateLimit(`purge:${context.auth.uid}`, {
        maxCalls: 3,
        windowMs: 60 * 60 * 1000,
      });
    } catch {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Silme işlemi için biraz bekleyip tekrar dene',
      );
    }
    const result = await purgeAccountForUser(context.auth.uid);
    if (!result.purged && result.reason === 'delete_not_requested') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Önce veri silme talebi oluşturmalısın',
      );
    }
    return result;
  });

/** Rewarded ad → +1 free solve (no product daily max; hourly abuse shield). */
export const grantRewardedSolve = regional.https.onCall(async (_data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  try {
    assertRateLimit(`rewarded:${context.auth.uid}`, {
      maxCalls: 40,
      windowMs: 60 * 60 * 1000,
    });
  } catch {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Çok hızlı denedin; biraz bekleyip tekrar dene',
    );
  }
  return grantRewardedSolveForUser(context.auth.uid);
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
    let ready = await storageObjectExists(imagePath);
    if (!ready) {
      await new Promise((r) => setTimeout(r, 2500));
      ready = await storageObjectExists(imagePath);
    }
    if (!ready) {
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
    // Path users/{uid}/uploads/{id}.jpg is the primary gate. Tag is optional
    // (GCS often lowercases keys — isSolveTaggedUpload is case-insensitive).
    // Untagged path matches still process so org-policy dogfood cannot stick.
    if (!isSolveTaggedUpload(meta)) {
      console.info('onSolveUploadFinalized: path match without tag — processing', {
        objectName,
        metaKeys: Object.keys(meta),
      });
    }

    const ref = getFirestore()
      .collection('users')
      .doc(parsed.uid)
      .collection('solveRequests')
      .doc(parsed.localId);

    const mimeFromMeta = metaValue(meta, 'mimeType');
    const mimeType =
      mimeFromMeta && mimeFromMeta.length > 0
        ? mimeFromMeta
        : event.data.contentType || 'image/jpeg';

    await processSolveRequest({
      ref,
      uid: parsed.uid,
      imagePath: parsed.imagePath,
      examType: metaValue(meta, 'examType'),
      mimeType,
      subjectHint: metaValue(meta, 'subjectHint'),
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

/** US6: Play Billing entitlement sync (verify token → users.subscriptionStatus) */
export const syncSubscription = regional.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş gerekli');
  }
  const productId = typeof data?.productId === 'string' ? data.productId : undefined;
  const purchaseToken =
    typeof data?.purchaseToken === 'string' ? data.purchaseToken : undefined;
  const sandboxActive = Boolean(data?.sandboxActive);

  const result = await syncSubscriptionForUser({
    uid: context.auth.uid,
    productId,
    purchaseToken,
    sandboxActive,
  });

  if (!result.synced) {
    if (result.reason === 'credentials_missing') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Play doğrulama kimlik bilgileri yapılandırılmamış',
      );
    }
    if (result.reason === 'sandbox_disabled') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Billing sandbox kapalı',
      );
    }
    if (result.reason === 'missing_token' || result.reason === 'invalid_product') {
      throw new functions.https.HttpsError('invalid-argument', 'Geçersiz satın alma');
    }
    throw new functions.https.HttpsError('permission-denied', 'Satın alma doğrulanamadı');
  }

  return result;
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
