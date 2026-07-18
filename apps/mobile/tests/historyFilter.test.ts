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
  },
  {
    attemptId: '2',
    createdAt: '2026-07-18T11:00:00Z',
    subject: 'turkish',
    topicId: 'lgs-turkish-paragraf',
    status: 'solved',
    thumbnailUrl: null,
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

  it('all passes through', () => {
    expect(filterAttempts(items, { subject: 'all', topicId: 'all' })).toHaveLength(2);
  });
});
