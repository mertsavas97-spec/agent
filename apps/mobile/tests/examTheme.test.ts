import { EXAM_THEME, examThemeFor } from '@/src/features/exam/examTheme';

describe('examTheme', () => {
  it('gives each exam a distinct solid color and MOD chip', () => {
    expect(EXAM_THEME.lgs.modeChip).toBe('MOD: LGS');
    expect(EXAM_THEME.ygs.modeChip).toBe('MOD: YGS');
    expect(EXAM_THEME.kpss.modeChip).toBe('MOD: KPSS');
    const solids = new Set([
      EXAM_THEME.lgs.solid,
      EXAM_THEME.ygs.solid,
      EXAM_THEME.kpss.solid,
    ]);
    expect(solids.size).toBe(3);
  });

  it('returns null for missing exam', () => {
    expect(examThemeFor(null)).toBeNull();
  });
});
