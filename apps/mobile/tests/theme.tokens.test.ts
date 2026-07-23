import { brand, colors, interaction, motion, typography } from '@/src/theme';

describe('moodboard tokens', () => {
  it('uses navy and orange from moodboard', () => {
    expect(colors.navy).toBe('#1E1B4B');
    expect(colors.orange).toBe('#F59E0B');
  });

  it('locks exam scope to LGS YGS KPSS Ehliyet', () => {
    expect(brand.exams).toEqual(['lgs', 'ygs', 'kpss', 'trafik']);
    expect(brand.name).toBe('ÇözBil');
  });

  it('exposes premium interaction and motion budgets', () => {
    expect(interaction.pressedOpacity).toBeLessThan(1);
    expect(interaction.minTouch).toBeGreaterThanOrEqual(44);
    expect(motion.fast).toBeLessThan(motion.normal);
    expect(motion.normal).toBeLessThan(motion.slow);
    expect(typography.size.display).toBeGreaterThan(typography.size.md);
  });
});
