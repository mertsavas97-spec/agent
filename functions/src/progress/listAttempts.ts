import { getFirestore } from 'firebase-admin/firestore';

import type {
  AttemptListItem,
  AttemptStatus,
  ListAttemptsRequest,
  ListAttemptsResponse,
  Subject,
} from '../types/contracts';

/** List + filter in memory to avoid composite index requirements in MVP. */
export async function listAttemptsForUser(
  uid: string,
  req: ListAttemptsRequest,
): Promise<ListAttemptsResponse> {
  const limit = Math.min(Math.max(req.limit ?? 20, 1), 50);
  const snap = await getFirestore()
    .collection('users')
    .doc(uid)
    .collection('attempts')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  let rows = snap.docs.map((d) => {
    const data = d.data();
    const created = data.createdAt?.toDate?.() as Date | undefined;
    return {
      attemptId: d.id,
      createdAt: created ? created.toISOString() : new Date(0).toISOString(),
      subject: (data.subject as Subject) ?? 'unknown',
      topicId: typeof data.topicId === 'string' ? data.topicId : null,
      status: (data.status as AttemptStatus) ?? 'failed',
      thumbnailUrl: null as string | null,
    } satisfies AttemptListItem;
  });

  if (req.subject && req.subject !== 'unknown') {
    rows = rows.filter((r) => r.subject === req.subject);
  }
  if (req.topicId) {
    rows = rows.filter((r) => r.topicId === req.topicId);
  }

  let start = 0;
  if (req.cursor) {
    const idx = rows.findIndex((r) => r.attemptId === req.cursor);
    start = idx >= 0 ? idx + 1 : 0;
  }

  const slice = rows.slice(start, start + limit);
  const nextCursor =
    start + limit < rows.length ? slice[slice.length - 1]?.attemptId ?? null : null;

  return { items: slice, nextCursor };
}
