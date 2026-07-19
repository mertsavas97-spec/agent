import { isExamType } from '../src/theme/examTypes';

describe('updateExamType validation', () => {
  it('accepts lgs, ygs, kpss, trafik', () => {
    expect(isExamType('lgs')).toBe(true);
    expect(isExamType('ygs')).toBe(true);
    expect(isExamType('kpss')).toBe(true);
    expect(isExamType('trafik')).toBe(true);
    expect(isExamType('yks')).toBe(false);
    expect(isExamType('')).toBe(false);
  });
});
