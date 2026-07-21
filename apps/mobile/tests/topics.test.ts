import {
  KPSS_TOPICS,
  LGS_TOPICS,
  YGS_TOPICS,
  findTopic,
  subjectsForExam,
  topicsForExam,
  topicsForExamSubject,
} from '@/src/data';

describe('mobile topic catalogs', () => {
  it('covers LGS YGS KPSS', () => {
    expect(topicsForExam('lgs')).toBe(LGS_TOPICS);
    expect(topicsForExam('ygs')).toBe(YGS_TOPICS);
    expect(topicsForExam('kpss')).toBe(KPSS_TOPICS);
  });

  it('exposes 2020–2026 subject trees', () => {
    expect(subjectsForExam('lgs')).toEqual([
      'turkish',
      'math',
      'science',
      'history',
      'religion',
      'english',
    ]);
    expect(subjectsForExam('ygs')).toContain('physics');
    expect(subjectsForExam('kpss')).toContain('civics');
    expect(topicsForExamSubject('lgs', 'science').length).toBeGreaterThan(0);
    expect(topicsForExamSubject('kpss', 'geometry').length).toBeGreaterThan(0);
  });

  it('finds topic by id', () => {
    const sample = LGS_TOPICS[0];
    expect(findTopic(sample.id)?.nameTr).toBe(sample.nameTr);
  });
});
