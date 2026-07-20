import { filterTopicsForExam } from '../src/progress/getProgressSummary';

describe('filterTopicsForExam', () => {
  const topics = [
    { topicId: 'lgs-math-kesirler', nameTr: 'Kesirler', attemptCount: 2, followUpCount: 0 },
    { topicId: 'ygs-math-sayilar', nameTr: 'Sayılar', attemptCount: 1, followUpCount: 0 },
    { topicId: 'kpss-math-yuzde', nameTr: 'Yüzde', attemptCount: 3, followUpCount: 1 },
  ];

  it('keeps only active exam topic ids', () => {
    expect(filterTopicsForExam(topics, 'ygs').map((t) => t.topicId)).toEqual([
      'ygs-math-sayilar',
    ]);
    expect(filterTopicsForExam(topics, 'lgs')).toHaveLength(1);
    expect(filterTopicsForExam(topics, 'kpss')).toHaveLength(1);
  });

  it('returns all when exam missing', () => {
    expect(filterTopicsForExam(topics, undefined)).toHaveLength(3);
  });
});
