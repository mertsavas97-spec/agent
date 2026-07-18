import { KPSS_TOPICS, LGS_TOPICS, YGS_TOPICS, topicsForExam } from '../src/data/topics';

describe('topic catalogs', () => {
  it('has math-first catalogs for all three exams', () => {
    expect(LGS_TOPICS.length).toBeGreaterThanOrEqual(8);
    expect(YGS_TOPICS.length).toBeGreaterThanOrEqual(8);
    expect(KPSS_TOPICS.length).toBeGreaterThanOrEqual(8);
    expect(topicsForExam('lgs')[0].examType).toBe('lgs');
    expect(topicsForExam('ygs')[0].examType).toBe('ygs');
    expect(topicsForExam('kpss')[0].examType).toBe('kpss');
  });

  it('uses exam-prefixed ids', () => {
    expect(LGS_TOPICS.every((t) => t.id.startsWith('lgs-'))).toBe(true);
    expect(YGS_TOPICS.every((t) => t.id.startsWith('ygs-'))).toBe(true);
    expect(KPSS_TOPICS.every((t) => t.id.startsWith('kpss-'))).toBe(true);
  });
});
