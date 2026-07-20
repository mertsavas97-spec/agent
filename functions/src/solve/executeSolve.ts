/**
 * Shared solve pipeline used by https callable AND Firestore trigger
 * (org-policy safe path — no public HTTP invoker required for trigger).
 */
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import {
  INVALID_RESTRICT_THRESHOLD,
  isTemporarilyRestricted,
  restrictionAfterScore,
} from '../abuse/invalidImageScore';
import { assertRateLimit } from '../abuse/rateLimit';
import { assertPersistentRateLimit } from '../abuse/persistentRateLimit';
import {
  assertDemoAiAllowedInRuntime,
  assertVisionConfiguredForLive,
  isDemoAiMode,
  liveBackendLabel,
} from '../config/runtime';
import { isKnownSubject, subjectsForExam } from '../data/subjects';
import { createVisionClient } from '../moderation/visionClient';
import { isExamType } from '../theme/examTypes';
import type { ExamType, SolveQuestionResponse, Subject } from '../types/contracts';
import { createGeminiSolver } from './geminiSolve';
import {
  createFirestoreCache,
  downloadImageBuffer,
  loadQuota,
  persistRejected,
  persistSolved,
} from './firestoreAdapters';
import { runSolveQuestion } from './solveQuestion';

export type SolvePipelineInput = {
  uid: string;
  imagePath: string;
  examType?: string;
  mimeType?: string;
  subjectHint?: string;
};

export class SolvePipelineError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'invalid-argument'
      | 'failed-precondition'
      | 'resource-exhausted'
      | 'internal',
  ) {
    super(message);
    this.name = 'SolvePipelineError';
  }
}

export async function executeSolvePipeline(
  input: SolvePipelineInput,
): Promise<SolveQuestionResponse> {
  const { uid } = input;
  const imagePath = input.imagePath;
  if (!imagePath.startsWith(`users/${uid}/`)) {
    throw new SolvePipelineError('Geçersiz görsel yolu', 'invalid-argument');
  }

  const userSnap = await getFirestore().collection('users').doc(uid).get();
  const userData = userSnap.data() ?? {};
  const examTypeRaw =
    typeof input.examType === 'string' ? input.examType : userData.examType;
  if (!examTypeRaw || !isExamType(examTypeRaw)) {
    throw new SolvePipelineError('Sınav türü seçilmedi', 'failed-precondition');
  }
  const examType = examTypeRaw as ExamType;

  const rateKey = `solve:${uid}`;
  try {
    assertRateLimit(rateKey);
    await assertPersistentRateLimit(rateKey, { db: getFirestore() });
  } catch (err) {
    if (err instanceof Error && err.name === 'RateLimitError') {
      throw new SolvePipelineError('Çok hızlı istek — biraz bekle', 'resource-exhausted');
    }
    throw err;
  }

  const invalidScore = Number(userData.invalidImageScore ?? 0);
  const restrictedUntil =
    typeof userData.restrictedUntil === 'number' ? userData.restrictedUntil : null;
  if (isTemporarilyRestricted({ invalidImageScore: invalidScore, restrictedUntil })) {
    throw new SolvePipelineError(
      'Geçici kısıtlama — biraz sonra tekrar dene',
      'resource-exhausted',
    );
  }
  if (invalidScore >= INVALID_RESTRICT_THRESHOLD && restrictedUntil == null) {
    const next = restrictionAfterScore(invalidScore);
    await getFirestore()
      .collection('users')
      .doc(uid)
      .set(
        { restrictedUntil: next.restrictedUntil, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    throw new SolvePipelineError(
      'Geçici kısıtlama — biraz sonra tekrar dene',
      'resource-exhausted',
    );
  }

  try {
    assertDemoAiAllowedInRuntime();
    assertVisionConfiguredForLive();
  } catch (err) {
    if (err instanceof Error && (err.name === 'DemoAiBlockedError' || err.name === 'VisionConfigError')) {
      throw new SolvePipelineError(err.message, 'failed-precondition');
    }
    throw err;
  }

  console.info('executeSolvePipeline aiBackend', liveBackendLabel());
  const imageBuffer = await downloadImageBuffer(imagePath);
  const allowedSubjects = subjectsForExam(examType);
  const subjectHint =
    typeof input.subjectHint === 'string' &&
    isKnownSubject(input.subjectHint) &&
    allowedSubjects.includes(input.subjectHint)
      ? input.subjectHint
      : undefined;

  const solver = createGeminiSolver();
  try {
    return await runSolveQuestion(
      {
        uid,
        imagePath,
        imageBuffer,
        examType,
        mimeType: input.mimeType ?? 'image/jpeg',
        subjectHint,
      },
      {
        vision: createVisionClient(),
        solver,
        cache: createFirestoreCache(),
        writeCacheEnabled: !isDemoAiMode() && solver.source === 'live',
        loadQuota,
        persistSolved,
        persistRejected,
      },
    );
  } catch (err) {
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      throw new SolvePipelineError('Günlük hak bitti', 'resource-exhausted');
    }
    if (err instanceof Error && err.name === 'RateLimitError') {
      throw new SolvePipelineError('Çok hızlı istek — biraz bekle', 'resource-exhausted');
    }
    console.error('executeSolvePipeline failed', {
      uid,
      imagePath,
      message: err instanceof Error ? err.message : 'unknown',
    });
    throw new SolvePipelineError('Çözüm şu an üretilemedi', 'internal');
  }
}

export type { Subject };
