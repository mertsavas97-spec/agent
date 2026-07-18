import { brand, colors } from '@/src/theme';

describe('moodboard tokens', () => {
  it('uses navy and orange from moodboard', () => {
    expect(colors.navy).toBe('#1E1B4B');
    expect(colors.orange).toBe('#F59E0B');
  });

  it('locks exam scope to LGS YGS KPSS', () => {
    expect(brand.exams).toEqual(['lgs', 'ygs', 'kpss']);
    expect(brand.name).toBe('ÇözBil');
  });
});
