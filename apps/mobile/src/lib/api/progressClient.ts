import {
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { findTopic } from '@/src/data';
import {
  listLocalHistory,
  toAttemptListItem,
} from '@/src/features/history/localHistoryStore';
import {
  buildProgressFromAttempts,
  mergeProgressSummaries,
} from '@/src/features/stats/buildProgressFromAttempts';
import type {
  AttemptListItem,
  ExamType,
  ListAttemptsRequest,
  ListAttemptsResponse,
  ProgressSummary,
  Subject,
} from '@/src/lib/api/types';
import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

function isCallableBlocked(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  return /permission-denied|unauthenticated|not-found|internal|unavailable/i.test(code);
}

async function readProfileExam(uid: string): Promise<ExamType | null> {
  try {
    const snap = await getDoc(doc(getFirebase().db, 'users', uid));
    const et = snap.data()?.examType;
    if (et === 'lgs' || et === 'ygs' || et === 'kpss') return et;
  } catch {
    /* optional */
  }
  return null;
}

async function progressFromFirestore(
  uid: string,
  examType: ExamType | null,
): Promise<ProgressSummary> {
  const { db } = getFirebase();
  const userSnap = await getDoc(doc(db, 'users', uid));
  const streakCount = Number(userSnap.data()?.streakCount ?? 0);

  const statsSnap = await getDocs(collection(db, 'topicStats', uid, 'topics'));
  let topics = statsSnap.docs.map((d) => {
    const data = d.data();
    const topicId = d.id;
    const attemptCount = Number(data.attemptCount ?? 0);
    const followUpCount = Number(data.followUpCount ?? 0);
    const nameTr = findTopic(topicId)?.nameTr ?? topicId;
    return { topicId, nameTr, attemptCount, followUpCount };
  });

  if (examType) {
    topics = topics.filter((t) => t.topicId.startsWith(`${examType}-`));
  }

  const weakest =
    topics.length === 0
      ? null
      : [...topics].sort((a, b) => {
          const wa = a.attemptCount === 0 ? 0 : a.followUpCount / a.attemptCount;
          const wb = b.attemptCount === 0 ? 0 : b.followUpCount / b.attemptCount;
          return wb - wa;
        })[0] ?? null;

  return {
    streakCount,
    weakestTopic: weakest,
    topics,
    weekly: [],
    examType: examType ?? undefined,
    totalSolved: topics.reduce((n, t) => n + t.attemptCount, 0),
    focusHint: weakest
      ? weakest.followUpCount > 0
        ? '“Anlamadım” sinyali yüksek — bugün bu konuya dön.'
        : 'En az denenen konu — dengeni buradan kur.'
      : null,
  };
}

async function attemptsFromFirestore(
  uid: string,
  req: ListAttemptsRequest,
): Promise<ListAttemptsResponse> {
  const { db } = getFirebase();
  const col = collection(db, 'users', uid, 'attempts');
  const lim = Math.min(req.limit ?? 20, 50);
  let q = query(col, orderBy('createdAt', 'desc'), fsLimit(lim));
  if (req.subject) {
    q = query(
      col,
      where('subject', '==', req.subject),
      orderBy('createdAt', 'desc'),
      fsLimit(lim),
    );
  }
  const snap = await getDocs(q);
  const items: AttemptListItem[] = snap.docs
    .map((d) => {
      const data = d.data();
      const createdAt =
        data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
      return {
        attemptId: d.id,
        createdAt,
        subject: (data.subject as Subject) ?? 'unknown',
        topicId: (data.topicId as string | null) ?? null,
        status: data.status ?? 'solved',
        thumbnailUrl: null,
        examType: data.examType,
        solutionId: (data.solutionId as string | null) ?? null,
      };
    })
    .filter((i) => (req.topicId ? i.topicId === req.topicId : true));
  return { items, nextCursor: null };
}

function mergeAttempts(
  remote: AttemptListItem[],
  local: AttemptListItem[],
  lim: number,
): AttemptListItem[] {
  const map = new Map<string, AttemptListItem>();
  for (const item of [...local, ...remote]) {
    if (!map.has(item.attemptId)) map.set(item.attemptId, item);
  }
  return Array.from(map.values())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, lim);
}

/** All attempts for client-side per-exam stats (independent of home exam). */
export async function fetchProgressAttempts(): Promise<AttemptListItem[]> {
  const res = await fetchAttempts({ limit: 50 });
  return res.items;
}

/**
 * Progress for a single exam tab. Does NOT force profile exam —
 * Stats UI picks the tab; home YGS ≠ hide KPSS data.
 */
export function progressForExam(
  items: AttemptListItem[],
  examType: ExamType,
): ProgressSummary {
  return buildProgressFromAttempts(items, examType);
}

/** @deprecated Prefer fetchProgressAttempts + progressForExam for Stats tabs. */
export async function fetchProgressSummary(): Promise<ProgressSummary> {
  const user = await ensureSignedIn();
  const examType = await readProfileExam(user.uid);
  const items = await fetchProgressAttempts();
  const fromLocal = buildProgressFromAttempts(items, examType);

  if (process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1') {
    return mergeProgressSummaries(
      {
        streakCount: 3,
        weakestTopic: {
          topicId: 'lgs-math-kesirler',
          nameTr: 'Kesirler',
          attemptCount: 2,
          followUpCount: 1,
        },
        topics: [
          {
            topicId: 'lgs-math-kesirler',
            nameTr: 'Kesirler',
            attemptCount: 4,
            followUpCount: 1,
          },
          {
            topicId: 'lgs-turkish-paragraf',
            nameTr: 'Paragraf',
            attemptCount: 2,
            followUpCount: 0,
          },
        ],
        weekly: fromLocal.weekly,
        examType: examType ?? 'lgs',
        totalSolved: 6,
        subjectMix: [
          { subject: 'math', label: 'Matematik', count: 4, pct: 67 },
          { subject: 'turkish', label: 'Türkçe', count: 2, pct: 33 },
        ],
        focusHint: '“Anlamadım” sinyali yüksek — bugün bu konuya dön.',
      },
      fromLocal,
    );
  }

  try {
    const { functions } = getFirebase();
    const callable = httpsCallable(functions, 'getProgressSummary');
    const result = await callable({});
    const remote = result.data as ProgressSummary;
    // Merge remote (profile-scoped) with full local list for that exam only
    return mergeProgressSummaries(
      { ...remote, examType: remote.examType ?? examType ?? undefined },
      fromLocal,
    );
  } catch (err) {
    if (!isCallableBlocked(err)) throw err;
    const fromFs = await progressFromFirestore(user.uid, examType);
    return mergeProgressSummaries(fromFs, fromLocal);
  }
}

export async function fetchAttempts(
  req: ListAttemptsRequest = {},
): Promise<ListAttemptsResponse> {
  const lim = Math.min(req.limit ?? 20, 50);
  const local = (await listLocalHistory(lim)).map(toAttemptListItem);

  if (process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1') {
    return {
      items: mergeAttempts(
        [
          {
            attemptId: 'demo-1',
            createdAt: new Date().toISOString(),
            subject: 'math',
            topicId: 'lgs-math-kesirler',
            status: 'solved',
            thumbnailUrl: null,
            examType: 'lgs',
          },
        ],
        local,
        lim,
      ),
      nextCursor: null,
    };
  }
  const user = await ensureSignedIn();
  try {
    const { functions } = getFirebase();
    const callable = httpsCallable(functions, 'listAttempts');
    const result = await callable(req);
    const remote = (result.data as ListAttemptsResponse).items ?? [];
    return { items: mergeAttempts(remote, local, lim), nextCursor: null };
  } catch (err) {
    if (!isCallableBlocked(err)) throw err;
    const remote = (await attemptsFromFirestore(user.uid, req)).items;
    return { items: mergeAttempts(remote, local, lim), nextCursor: null };
  }
}
