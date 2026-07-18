import { getFirestore } from 'firebase-admin/firestore';

import { ALL_TOPICS } from '../data/topics';
import { isExamType } from '../theme/examTypes';
import type { ProgressSummary, ProgressTopic } from '../types/contracts';
import { displayStreakCount, istanbulDateString, previousIstanbulDate } from './streak';
import { selectWeakestTopic } from './weakestTopic';

function nameForTopic(topicId: string): string {
  return ALL_TOPICS.find((t) => t.id === topicId)?.nameTr ?? topicId;
}

/** Keep stats scoped to the active exam catalog after mid-app exam switch. */
export function filterTopicsForExam(
  topics: ProgressTopic[],
  examType: string | undefined,
): ProgressTopic[] {
  if (!examType || !isExamType(examType)) return topics;
  const prefix = `${examType}-`;
  return topics.filter((t) => t.topicId.startsWith(prefix));
}

export async function getProgressSummaryForUser(uid: string): Promise<ProgressSummary> {
  const db = getFirestore();
  const userSnap = await db.collection('users').doc(uid).get();
  const user = userSnap.data() ?? {};
  const today = istanbulDateString();

  const streakCount = displayStreakCount({
    streakCount: Number(user.streakCount ?? 0),
    streakLastActiveDate: (user.streakLastActiveDate as string | null) ?? null,
    today,
  });

  const statsSnap = await db.collection('topicStats').doc(uid).collection('topics').get();
  const allTopics: ProgressTopic[] = statsSnap.docs.map((d) => {
    const data = d.data();
    return {
      topicId: d.id,
      nameTr: nameForTopic(d.id),
      attemptCount: Number(data.attemptCount ?? 0),
      followUpCount: Number(data.followUpCount ?? 0),
    };
  });
  const topics = filterTopicsForExam(allTopics, user.examType as string | undefined);

  const weakestTopic = selectWeakestTopic(topics);

  // Last 7 Istanbul days including today
  const weekly: { date: string; solvedCount: number }[] = [];
  let cursor = today;
  for (let i = 0; i < 7; i++) {
    weekly.unshift({ date: cursor, solvedCount: 0 });
    cursor = previousIstanbulDate(cursor);
  }

  const weekStart = weekly[0]!.date;
  const attemptsSnap = await db
    .collection('users')
    .doc(uid)
    .collection('attempts')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();

  for (const doc of attemptsSnap.docs) {
    const data = doc.data();
    if (data.status !== 'solved') continue;
    const created = data.createdAt?.toDate?.() as Date | undefined;
    if (!created) continue;
    const day = istanbulDateString(created);
    if (day < weekStart) continue;
    const row = weekly.find((w) => w.date === day);
    if (row) row.solvedCount += 1;
  }

  return { streakCount, weakestTopic, topics, weekly };
}
