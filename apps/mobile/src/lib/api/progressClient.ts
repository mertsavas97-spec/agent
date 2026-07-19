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
import type {
  AttemptListItem,
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

async function progressFromFirestore(uid: string): Promise<ProgressSummary> {
  const { db } = getFirebase();
  const userSnap = await getDoc(doc(db, 'users', uid));
  const streakCount = Number(userSnap.data()?.streakCount ?? 0);

  const statsSnap = await getDocs(collection(db, 'topicStats', uid, 'topics'));
  const topics = statsSnap.docs.map((d) => {
    const data = d.data();
    const topicId = d.id;
    const attemptCount = Number(data.attemptCount ?? 0);
    const followUpCount = Number(data.followUpCount ?? 0);
    const nameTr = findTopic(topicId)?.nameTr ?? topicId;
    return { topicId, nameTr, attemptCount, followUpCount };
  });

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
    q = query(col, where('subject', '==', req.subject), orderBy('createdAt', 'desc'), fsLimit(lim));
  }
  const snap = await getDocs(q);
  const items: AttemptListItem[] = snap.docs
    .map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
      return {
        attemptId: d.id,
        createdAt,
        subject: (data.subject as Subject) ?? 'unknown',
        topicId: (data.topicId as string | null) ?? null,
        status: data.status ?? 'solved',
        thumbnailUrl: null,
      };
    })
    .filter((i) => (req.topicId ? i.topicId === req.topicId : true));
  return { items, nextCursor: null };
}

export async function fetchProgressSummary(): Promise<ProgressSummary> {
  if (process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1') {
    return {
      streakCount: 3,
      weakestTopic: null,
      topics: [],
      weekly: [],
    };
  }
  const user = await ensureSignedIn();
  try {
    const { functions } = getFirebase();
    const callable = httpsCallable(functions, 'getProgressSummary');
    const result = await callable({});
    return result.data as ProgressSummary;
  } catch (err) {
    if (!isCallableBlocked(err)) throw err;
    return progressFromFirestore(user.uid);
  }
}

export async function fetchAttempts(
  req: ListAttemptsRequest = {},
): Promise<ListAttemptsResponse> {
  if (process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1') {
    return {
      items: [
        {
          attemptId: 'demo-1',
          createdAt: new Date().toISOString(),
          subject: 'math',
          topicId: 'lgs-math-kesirler',
          status: 'solved',
          thumbnailUrl: null,
        },
      ],
      nextCursor: null,
    };
  }
  const user = await ensureSignedIn();
  try {
    const { functions } = getFirebase();
    const callable = httpsCallable(functions, 'listAttempts');
    const result = await callable(req);
    return result.data as ListAttemptsResponse;
  } catch (err) {
    if (!isCallableBlocked(err)) throw err;
    return attemptsFromFirestore(user.uid, req);
  }
}
