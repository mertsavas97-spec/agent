import { SUBJECT_THEME, subjectThemeFor } from '@/src/features/exam/subjectTheme';

describe('subjectTheme', () => {
  it('gives trafik branches distinct accents', () => {
    expect(subjectThemeFor('traffic').solid).toBe(SUBJECT_THEME.traffic.solid);
    expect(subjectThemeFor('vehicle').solid).not.toBe(subjectThemeFor('traffic').solid);
    expect(subjectThemeFor('firstaid').solid).toBeTruthy();
  });

  it('falls back for unknown', () => {
    expect(subjectThemeFor('unknown').solid).toBeTruthy();
  });
});
