import { filterAttempts } from '@/src/features/history/filterAttempts';
import type { AttemptListItem } from '@/src/lib/api/types';

const items: AttemptListItem[] = [
  {
    attemptId: '1',
    createdAt: '2026-07-18T10:00:00Z',
    subject: 'math',
    topicId: 'lgs-math-kesirler',
    status: 'solved',
    thumbnailUrl: null,
    examType: 'lgs',
  },
  {
    attemptId: '2',
    createdAt: '2026-07-18T11:00:00Z',
    subject: 'turkish',
    topicId: 'lgs-turkish-paragraf',
    status: 'solved',
    thumbnailUrl: null,
    examType: 'lgs',
  },
  {
    attemptId: '3',
    createdAt: '2026-07-18T12:00:00Z',
    subject: 'turkish',
    topicId: 'kpss-turkish-anlam',
    status: 'solved',
    thumbnailUrl: null,
    examType: 'kpss',
  },
];

describe('filterAttempts', () => {
  it('filters by subject', () => {
    expect(filterAttempts(items, { subject: 'math' })).toHaveLength(1);
  });

  it('filters by topicId', () => {
    expect(filterAttempts(items, { topicId: 'lgs-turkish-paragraf' })).toEqual([
      items[1],
    ]);
  });

  it('filters by examType', () => {
    expect(filterAttempts(items, { examType: 'kpss' })).toEqual([items[2]]);
  });

  it('all passes through', () => {
    expect(
      filterAttempts(items, { examType: 'all', subject: 'all', topicId: 'all' }),
    ).toHaveLength(3);
  });
});
