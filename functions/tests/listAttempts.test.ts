import type { AttemptListItem } from '../src/types/contracts';

/** Pure filter mirror used by mobile; server filters similarly. */
function filterRows(
  rows: AttemptListItem[],
  subject?: string,
  topicId?: string,
): AttemptListItem[] {
  return rows.filter((r) => {
    if (subject && r.subject !== subject) return false;
    if (topicId && r.topicId !== topicId) return false;
    return true;
  });
}

describe('listAttempts filter contract', () => {
  const rows: AttemptListItem[] = [
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

  it('filters subject and topic', () => {
    expect(filterRows(rows, 'math')).toHaveLength(1);
    expect(filterRows(rows, undefined, 'lgs-turkish-paragraf')).toHaveLength(1);
  });
});
