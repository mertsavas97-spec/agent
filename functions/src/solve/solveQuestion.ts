import { SAFETY_MESSAGES } from '../safety/messages';
import type { CacheStore } from '../cache/solutionCache';
import { lookupCache, writeCache } from '../cache/solutionCache';
import { computePhash } from '../cache/phash';
import { evaluateSafeSearch, shouldBillQuota } from '../moderation/safeSearch';
import type { VisionClient } from '../moderation/visionClient';
import { assertHasQuota, istanbulDate, remainingQuota, type QuotaState } from '../quota/dailyQuota';
import type {
  ExamType,
  SolveQuestionRejected,
  SolveQuestionResponse,
  SolveQuestionSuccess,
} from '../types/contracts';
import type { VisionSolver } from './geminiSolve';
import { isGeometryUnsupported } from './parseSolution';

export type SolveDeps = {
  vision: VisionClient;
  solver: VisionSolver;
  cache: CacheStore;
  loadQuota: (uid: string) => Promise<QuotaState>;
  persistSolved: (input: {
    uid: string;
    phash: string;
    imagePath: string;
    examType: ExamType;
    result: SolveQuestionSuccess;
    billed: boolean;
  }) => Promise<{ attemptId: string; solutionId: string }>;
  persistRejected: (input: {
    uid: string;
    imagePath: string;
    status: SolveQuestionRejected['status'];
    phash: string;
  }) => Promise<{ attemptId: string }>;
};

export type SolveInput = {
  uid: string;
  imagePath: string;
  imageBuffer: Buffer;
  examType: ExamType;
  mimeType?: string;
};

export async function runSolveQuestion(
  input: SolveInput,
  deps: SolveDeps,
): Promise<SolveQuestionResponse> {
  const quotaState = await deps.loadQuota(input.uid);
  const today = istanbulDate();
  assertHasQuota(quotaState, today);

  const labels = await deps.vision.safeSearch(input.imageBuffer);
  const moderation = evaluateSafeSearch(labels);
  const phash = computePhash(input.imageBuffer);

  if (!moderation.ok) {
    const { attemptId } = await deps.persistRejected({
      uid: input.uid,
      imagePath: input.imagePath,
      status: 'rejected_moderation',
      phash,
    });
    return {
      attemptId,
      status: 'rejected_moderation',
      userMessage: moderation.userMessage,
      quota: {
        remainingToday: remainingQuota(quotaState, today),
        unlimited: remainingQuota(quotaState, today) > 1000,
      },
    };
  }

  const cached = await lookupCache(deps.cache, phash, input.examType);
  if (cached) {
    const success: SolveQuestionSuccess = {
      attemptId: 'pending',
      solutionId: 'pending',
      status: 'solved',
      cached: true,
      topicId: cached.topicId,
      subject: cached.subject,
      steps: cached.steps,
      transparencyNote: SAFETY_MESSAGES.transparency,
      quota: {
        remainingToday: Math.max(0, remainingQuota(quotaState, today) - 1),
        unlimited: remainingQuota(quotaState, today) > 1000,
      },
    };
    const { attemptId, solutionId } = await deps.persistSolved({
      uid: input.uid,
      phash,
      imagePath: input.imagePath,
      examType: input.examType,
      result: success,
      billed: shouldBillQuota('solved'),
    });
    return { ...success, attemptId, solutionId };
  }

  const parsed = await deps.solver.solve({
    imageBase64: input.imageBuffer.toString('base64'),
    mimeType: input.mimeType ?? 'image/jpeg',
    examType: input.examType,
  });

  if (!parsed.isQuestion) {
    const { attemptId } = await deps.persistRejected({
      uid: input.uid,
      imagePath: input.imagePath,
      status: 'rejected_not_question',
      phash,
    });
    return {
      attemptId,
      status: 'rejected_not_question',
      userMessage: SAFETY_MESSAGES.notAQuestion,
      quota: {
        remainingToday: remainingQuota(quotaState, today),
        unlimited: remainingQuota(quotaState, today) > 1000,
      },
    };
  }

  if (isGeometryUnsupported(parsed) || parsed.steps.length === 0) {
    const { attemptId } = await deps.persistRejected({
      uid: input.uid,
      imagePath: input.imagePath,
      status: 'unsupported_type',
      phash,
    });
    return {
      attemptId,
      status: 'unsupported_type',
      userMessage: SAFETY_MESSAGES.unsupportedType,
      quota: {
        remainingToday: remainingQuota(quotaState, today),
        unlimited: remainingQuota(quotaState, today) > 1000,
      },
    };
  }

  const success: SolveQuestionSuccess = {
    attemptId: 'pending',
    solutionId: 'pending',
    status: 'solved',
    cached: false,
    topicId: parsed.topicId,
    subject: parsed.subject,
    steps: parsed.steps,
    transparencyNote: SAFETY_MESSAGES.transparency,
    quota: {
      remainingToday: Math.max(0, remainingQuota(quotaState, today) - 1),
      unlimited: remainingQuota(quotaState, today) > 1000,
    },
  };

  await writeCache(deps.cache, phash, input.examType, {
    phash,
    topicId: parsed.topicId,
    steps: parsed.steps,
    subject: parsed.subject,
  });

  const { attemptId, solutionId } = await deps.persistSolved({
    uid: input.uid,
    phash,
    imagePath: input.imagePath,
    examType: input.examType,
    result: success,
    billed: shouldBillQuota('solved'),
  });

  return { ...success, attemptId, solutionId };
}
