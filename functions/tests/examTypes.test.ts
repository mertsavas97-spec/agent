import { EXAM_TYPES, isExamType } from '../src/theme/examTypes';

describe('examTypes', () => {
  it('includes LGS, YGS, and KPSS', () => {
    expect(EXAM_TYPES).toEqual(['lgs', 'ygs', 'kpss', 'trafik']);
  });

  it('validates exam type strings', () => {
    expect(isExamType('lgs')).toBe(true);
    expect(isExamType('ygs')).toBe(true);
    expect(isExamType('kpss')).toBe(true);
    expect(isExamType('yks')).toBe(false);
  });
});
