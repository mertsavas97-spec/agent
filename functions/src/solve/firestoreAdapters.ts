import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import type { CacheStore, CachedSolution } from '../cache/solutionCache';
import { cacheKeyFromPhash } from '../cache/phash';
import { nextStreakCount } from '../progress/streak';
import { assertHasQuota, type QuotaState } from '../quota/dailyQuota';
import type { ExamType, SolveQuestionSuccess } from '../types/contracts';

export function createFirestoreCache(): CacheStore {
  const db = getFirestore();
  return {
    async get(key) {
      const snap = await db.collection('solutionCache').doc(key).get();
      if (!snap.exists) return null;
      return snap.data() as CachedSolution;
    },
    async set(key, value) {
      await db.collection('solutionCache').doc(key).set({
        ...value,
        hitCount: FieldValue.increment(0),
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    },
  };
}

export async function loadQuota(uid: string): Promise<QuotaState> {
  const snap = await getFirestore().collection('users').doc(uid).get();
  if (!snap.exists) {
    return {
      dailySolveCount: 0,
      dailySolveDate: null,
      subscriptionStatus: 'free',
      rewardedBonusCount: 0,
      rewardedBonusDate: null,
    };
  }
  const data = snap.data()!;
  return {
    dailySolveCount: Number(data.dailySolveCount ?? 0),
    dailySolveDate: (data.dailySolveDate as string | null) ?? null,
    subscriptionStatus: (data.subscriptionStatus as QuotaState['subscriptionStatus']) ?? 'free',
    rewardedBonusCount: Number(data.rewardedBonusCount ?? 0),
    rewardedBonusDate: (data.rewardedBonusDate as string | null) ?? null,
  };
}

export async function downloadImageBuffer(imagePath: string): Promise<Buffer> {
  const bucket = getStorage().bucket();
  const [buf] = await bucket.file(imagePath).download();
  return buf;
}

export async function persistSolved(input: {
  uid: string;
  phash: string;
  imagePath: string;
  examType: ExamType;
  result: SolveQuestionSuccess;
  billed: boolean;
}): Promise<{ attemptId: string; solutionId: string }> {
  const db = getFirestore();
  const attemptRef = db.collection('users').doc(input.uid).collection('attempts').doc();
  const solutionRef = db.collection('users').doc(input.uid).collection('solutions').doc();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });

  await db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(input.uid);
    const userSnap = await tx.get(userRef);
    const user = userSnap.data() ?? {};
    const sameDay = user.dailySolveDate === today;
    if (input.billed) {
      // The initial check happens before OCR/AI work. Re-check inside the same
      // transaction that increments usage so concurrent solves cannot both
      // consume the final free slot.
      assertHasQuota(
        {
          dailySolveCount: Number(user.dailySolveCount ?? 0),
          dailySolveDate: (user.dailySolveDate as string | null) ?? null,
          subscriptionStatus:
            (user.subscriptionStatus as QuotaState['subscriptionStatus']) ?? 'free',
        },
        today,
      );
    }
    const nextCount = input.billed
      ? (sameDay ? Number(user.dailySolveCount ?? 0) + 1 : 1)
      : Number(user.dailySolveCount ?? 0);

    tx.set(attemptRef, {
      imagePath: input.imagePath,
      phash: input.phash,
      status: 'solved',
      subject: input.result.subject,
      topicId: input.result.topicId,
      solutionId: solutionRef.id,
      billed: input.billed,
      examType: input.examType,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(solutionRef, {
      attemptId: attemptRef.id,
      steps: input.result.steps,
      answer: input.result.answer ?? null,
      transparencyNoteShown: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    if (input.billed) {
      const streak = nextStreakCount({
        streakCount: Number(user.streakCount ?? 0),
        streakLastActiveDate: (user.streakLastActiveDate as string | null) ?? null,
        today,
      });
      tx.set(
        userRef,
        {
          dailySolveCount: nextCount,
          dailySolveDate: today,
          streakCount: streak.streakCount,
          streakLastActiveDate: streak.streakLastActiveDate,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    if (input.result.topicId) {
      const statsRef = db
        .collection('topicStats')
        .doc(input.uid)
        .collection('topics')
        .doc(input.result.topicId);
      tx.set(
        statsRef,
        {
          attemptCount: FieldValue.increment(1),
          solvedCount: FieldValue.increment(1),
          lastAttemptAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    tx.set(
      db.collection('solutionCache').doc(cacheKeyFromPhash(input.phash, input.examType)),
      {
        phash: input.phash,
        topicId: input.result.topicId,
        steps: input.result.steps,
        subject: input.result.subject,
        answer: input.result.answer ?? null,
        hitCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return { attemptId: attemptRef.id, solutionId: solutionRef.id };
}

export async function persistRejected(input: {
  uid: string;
  imagePath: string;
  status: 'rejected_moderation' | 'rejected_not_question' | 'unsupported_type';
  phash: string;
}): Promise<{ attemptId: string }> {
  const ref = getFirestore().collection('users').doc(input.uid).collection('attempts').doc();
  const payload: Record<string, unknown> = {
    imagePath: input.imagePath,
    phash: input.phash,
    status: input.status,
    billed: false,
    createdAt: FieldValue.serverTimestamp(),
  };
  if (input.status === 'rejected_moderation') {
    payload.moderationLabels = { blocked: true };
    const userRef = getFirestore().collection('users').doc(input.uid);
    const snap = await userRef.get();
    const prev = Number(snap.data()?.invalidImageScore ?? 0) + 1;
    const patch: Record<string, unknown> = {
      invalidImageScore: prev,
      updatedAt: FieldValue.serverTimestamp(),
    };
    // Soft restrict after threshold (30 min) — see abuse/invalidImageScore.ts
    if (prev >= 8) {
      patch.restrictedUntil = Date.now() + 30 * 60 * 1000;
    }
    await userRef.set(patch, { merge: true });
  }
  await ref.set(payload);
  return { attemptId: ref.id };
}
