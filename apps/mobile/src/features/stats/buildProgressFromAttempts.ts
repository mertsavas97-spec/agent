import { findTopic, subjectLabel } from '@/src/data';
import type {
  AttemptListItem,
  ExamType,
  ProgressSubjectMix,
  ProgressSummary,
  ProgressTopic,
  Subject,
} from '@/src/lib/api/types';

import {
  currentIstanbulWeekMondayToSunday,
  istanbulDateKey,
  streakFromActiveDates,
} from './istanbulDates';

function attemptIstanbulDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return istanbulDateKey();
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
}

function selectWeakest(topics: ProgressTopic[]): {
  topic: ProgressTopic | null;
  focusHint: string | null;
} {
  if (topics.length === 0) return { topic: null, focusHint: null };

  const withFollowUp = topics.filter((t) => t.followUpCount > 0);
  if (withFollowUp.length > 0) {
    const topic = [...withFollowUp].sort((a, b) => {
      const ra = a.followUpCount / Math.max(1, a.attemptCount);
      const rb = b.followUpCount / Math.max(1, b.attemptCount);
      if (rb !== ra) return rb - ra;
      return a.attemptCount - b.attemptCount;
    })[0]!;
    return {
      topic,
      focusHint: '“Anlamadım” sinyali yüksek — bugün bu konuya dön.',
    };
  }

  // Dogfood: no follow-ups → least practiced topic among attempted
  const topic = [...topics].sort((a, b) => {
    if (a.attemptCount !== b.attemptCount) return a.attemptCount - b.attemptCount;
    return a.topicId.localeCompare(b.topicId);
  })[0]!;
  return {
    topic,
    focusHint: 'En az denenen konu — dengeni buradan kur.',
  };
}

function buildSubjectMix(
  items: AttemptListItem[],
): ProgressSubjectMix[] {
  const counts = new Map<Subject, number>();
  for (const item of items) {
    if (item.status !== 'solved') continue;
    if (item.subject === 'unknown') continue;
    counts.set(item.subject, (counts.get(item.subject) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return [...counts.entries()]
    .map(([subject, count]) => ({
      subject,
      label: subjectLabel(subject),
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * Build ProgressSummary from attempt list (local dogfood and/or remote).
 * Filters by examType when provided.
 */
export function buildProgressFromAttempts(
  items: AttemptListItem[],
  examType?: ExamType | null,
  today = istanbulDateKey(),
): ProgressSummary {
  const scoped = items.filter((i) => {
    if (i.status && i.status !== 'solved') return false;
    if (!examType) return true;
    if (i.examType) return i.examType === examType;
    if (i.topicId?.startsWith(`${examType}-`)) return true;
    // Local entries without exam/topic prefix: include only if no exam filter
    return !i.examType && !i.topicId;
  });

  const topicMap = new Map<string, ProgressTopic>();
  const activeDays = new Set<string>();

  for (const item of scoped) {
    activeDays.add(attemptIstanbulDay(item.createdAt));
    const topicId = item.topicId;
    if (!topicId) continue;
    const prev = topicMap.get(topicId);
    if (prev) {
      prev.attemptCount += 1;
    } else {
      topicMap.set(topicId, {
        topicId,
        nameTr: findTopic(topicId)?.nameTr ?? topicId,
        attemptCount: 1,
        followUpCount: 0,
      });
    }
  }

  const topics = [...topicMap.values()].sort(
    (a, b) => b.attemptCount - a.attemptCount,
  );
  const { topic: weakestTopic, focusHint } = selectWeakest(topics);
  const weekDays = currentIstanbulWeekMondayToSunday(today);
  const weekly = weekDays.map((date) => ({
    date,
    solvedCount: scoped.filter(
      (i) => attemptIstanbulDay(i.createdAt) === date,
    ).length,
  }));

  return {
    streakCount: streakFromActiveDates(activeDays, today),
    weakestTopic,
    topics,
    weekly,
    examType: examType ?? undefined,
    totalSolved: scoped.length,
    subjectMix: buildSubjectMix(scoped),
    focusHint,
  };
}

/** Prefer remote when rich; fill gaps from local-derived summary. */
export function mergeProgressSummaries(
  remote: ProgressSummary,
  local: ProgressSummary,
): ProgressSummary {
  const useLocalTopics = remote.topics.length === 0 && local.topics.length > 0;
  const topics = useLocalTopics ? local.topics : remote.topics;
  const weakestTopic = useLocalTopics
    ? local.weakestTopic
    : (remote.weakestTopic ?? local.weakestTopic);
  const remoteWeeklyEmpty =
    remote.weekly.length === 0 ||
    remote.weekly.every((w) => w.solvedCount === 0);
  const weekly =
    remoteWeeklyEmpty && local.weekly.some((w) => w.solvedCount > 0)
      ? local.weekly
      : remote.weekly.length > 0
        ? remote.weekly
        : local.weekly;

  return {
    streakCount: Math.max(remote.streakCount, local.streakCount),
    weakestTopic,
    topics,
    weekly,
    examType: remote.examType ?? local.examType,
    totalSolved: Math.max(remote.totalSolved ?? 0, local.totalSolved ?? 0),
    subjectMix:
      (remote.subjectMix && remote.subjectMix.length > 0
        ? remote.subjectMix
        : local.subjectMix) ?? [],
    focusHint: useLocalTopics
      ? local.focusHint
      : (remote.focusHint ?? local.focusHint),
  };
}
