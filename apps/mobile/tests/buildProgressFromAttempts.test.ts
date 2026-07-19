import {
  buildProgressFromAttempts,
  mergeProgressSummaries,
} from '@/src/features/stats/buildProgressFromAttempts';
import {
  previousIstanbulDate,
  streakFromActiveDates,
} from '@/src/features/stats/istanbulDates';
import type { AttemptListItem, ProgressSummary } from '@/src/lib/api/types';

const today = '2026-07-19';
const yesterday = previousIstanbulDate(today);

function item(
  over: Partial<AttemptListItem> & Pick<AttemptListItem, 'attemptId'>,
): AttemptListItem {
  return {
    createdAt: `${today}T12:00:00.000Z`,
    subject: 'math',
    topicId: 'kpss-math-temel-islemler',
    status: 'solved',
    thumbnailUrl: null,
    examType: 'kpss',
    ...over,
  };
}

describe('streakFromActiveDates', () => {
  it('counts consecutive days ending today', () => {
    expect(
      streakFromActiveDates([today, yesterday, previousIstanbulDate(yesterday)], today),
    ).toBe(3);
  });

  it('holds streak if last active was yesterday', () => {
    expect(streakFromActiveDates([yesterday], today)).toBe(1);
  });

  it('breaks if gap > 1 day', () => {
    expect(streakFromActiveDates([previousIstanbulDate(yesterday)], today)).toBe(0);
  });
});

describe('buildProgressFromAttempts', () => {
  it('scopes by exam and builds weekly + subject mix', () => {
    const items = [
      item({ attemptId: '1', examType: 'kpss', topicId: 'kpss-turkish-anlam', subject: 'turkish' }),
      item({
        attemptId: '2',
        examType: 'kpss',
        topicId: 'kpss-math-temel-islemler',
        subject: 'math',
        createdAt: `${yesterday}T10:00:00.000Z`,
      }),
      item({
        attemptId: '3',
        examType: 'ygs',
        topicId: 'ygs-math-temel-kavramlar',
        subject: 'math',
      }),
    ];
    const summary = buildProgressFromAttempts(items, 'kpss', today);
    expect(summary.totalSolved).toBe(2);
    expect(summary.topics).toHaveLength(2);
    expect(summary.streakCount).toBe(2);
    expect(summary.weekly).toHaveLength(7);
    expect(summary.weekly.find((w) => w.date === today)?.solvedCount).toBe(1);
    expect(summary.subjectMix?.some((s) => s.subject === 'turkish')).toBe(true);
    expect(summary.weakestTopic).toBeTruthy();
  });
});

describe('mergeProgressSummaries', () => {
  it('fills empty remote from local', () => {
    const remote: ProgressSummary = {
      streakCount: 0,
      weakestTopic: null,
      topics: [],
      weekly: [],
    };
    const local = buildProgressFromAttempts(
      [item({ attemptId: 'a' })],
      'kpss',
      today,
    );
    const merged = mergeProgressSummaries(remote, local);
    expect(merged.topics.length).toBeGreaterThan(0);
    expect(merged.streakCount).toBeGreaterThanOrEqual(1);
  });
});
