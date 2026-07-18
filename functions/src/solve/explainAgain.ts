import { GoogleGenerativeAI } from '@google/generative-ai';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { useVertexAi, vertexGenerateContent } from '../ai/vertexClient';
import { isDemoAiMode } from '../config/runtime';
import type { ExamType } from '../types/contracts';
import { explainAgainPrompt } from './prompts';

export type ExplainDeps = {
  loadSolution: (uid: string, solutionId: string) => Promise<{
    stepsText: string;
    topicId: string | null;
    examType: ExamType;
  } | null>;
  generate: (input: {
    examType: ExamType;
    priorSteps: string;
  }) => Promise<string>;
  persistFollowUp: (input: {
    uid: string;
    solutionId: string;
    explanation: string;
    topicId: string | null;
  }) => Promise<{ followUpId: string }>;
  assertExplainAllowed: (uid: string) => void;
};

export async function runExplainAgain(
  input: { uid: string; solutionId: string },
  deps: ExplainDeps,
): Promise<{ followUpId: string; explanation: string; billed: false }> {
  deps.assertExplainAllowed(input.uid);

  const solution = await deps.loadSolution(input.uid, input.solutionId);
  if (!solution) {
    const err = new Error('NOT_FOUND');
    err.name = 'NotFoundError';
    throw err;
  }

  const explanation = await deps.generate({
    examType: solution.examType,
    priorSteps: solution.stepsText,
  });

  const { followUpId } = await deps.persistFollowUp({
    uid: input.uid,
    solutionId: input.solutionId,
    explanation,
    topicId: solution.topicId,
  });

  return { followUpId, explanation, billed: false };
}

export function demoExplanation(examType: ExamType, priorSteps: string): string {
  return [
    'Daha sade anlatayım:',
    '1) Soruda ne istendiğini bir cümleyle yaz.',
    '2) Bilinenleri küçük parçalara böl.',
    '3) Her parçayı sırayla işle; acele etme.',
    '',
    `(Demo açıklama — ${examType})`,
    priorSteps.slice(0, 280),
  ].join('\n');
}

export function createExplainGenerator(): ExplainDeps['generate'] {
  return async ({ examType, priorSteps }) => {
    if (isDemoAiMode()) {
      return demoExplanation(examType, priorSteps);
    }

    if (useVertexAi()) {
      return vertexGenerateContent([
        { text: explainAgainPrompt(examType) },
        { text: `Önceki çözüm:\n${priorSteps}` },
      ]);
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) return demoExplanation(examType, priorSteps);

    const model = new GoogleGenerativeAI(key).getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
    const result = await model.generateContent([
      { text: explainAgainPrompt(examType) },
      { text: `Önceki çözüm:\n${priorSteps}` },
    ]);
    return result.response.text();
  };
}

const explainHits = new Map<string, { count: number; windowStart: number }>();

export function assertExplainRateLimit(uid: string, now = Date.now()): void {
  const windowMs = 60_000;
  const max = 10;
  const cur = explainHits.get(uid);
  if (!cur || now - cur.windowStart > windowMs) {
    explainHits.set(uid, { count: 1, windowStart: now });
    return;
  }
  cur.count += 1;
  if (cur.count > max) {
    const err = new Error('RATE_LIMIT');
    err.name = 'RateLimitError';
    throw err;
  }
}

/** Test helper — clear rate-limit windows. */
export function _resetExplainRateLimitForTests(): void {
  explainHits.clear();
}

export async function loadSolutionForExplain(uid: string, solutionId: string) {
  const db = getFirestore();
  const snap = await db
    .collection('users')
    .doc(uid)
    .collection('solutions')
    .doc(solutionId)
    .get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const stepsText = steps
    .map((s: { title?: string; body?: string }, i: number) =>
      `${s.title ?? `${i + 1}.`} ${s.body ?? ''}`.trim(),
    )
    .join('\n');

  let examType: ExamType = 'lgs';
  let topicId: string | null = null;
  if (typeof data.attemptId === 'string') {
    const attempt = await db
      .collection('users')
      .doc(uid)
      .collection('attempts')
      .doc(data.attemptId)
      .get();
    if (attempt.exists) {
      const a = attempt.data()!;
      if (a.examType === 'ygs' || a.examType === 'kpss' || a.examType === 'lgs') {
        examType = a.examType;
      }
      topicId = typeof a.topicId === 'string' ? a.topicId : null;
    }
  }

  return { stepsText, topicId, examType };
}

export async function persistFollowUp(input: {
  uid: string;
  solutionId: string;
  explanation: string;
  topicId: string | null;
}): Promise<{ followUpId: string }> {
  const db = getFirestore();
  const ref = db.collection('users').doc(input.uid).collection('followUps').doc();
  await ref.set({
    solutionId: input.solutionId,
    explanation: input.explanation,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (input.topicId) {
    const statsRef = db
      .collection('topicStats')
      .doc(input.uid)
      .collection('topics')
      .doc(input.topicId);
    await statsRef.set(
      {
        followUpCount: FieldValue.increment(1),
        lastAttemptAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  return { followUpId: ref.id };
}
