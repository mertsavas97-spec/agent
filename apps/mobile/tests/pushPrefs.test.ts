import {
  PUSH_CATEGORIES,
  PUSH_COPY,
  pickPushCopy,
} from '@/src/features/push/pushPrefs';

describe('pushPrefs copy matrix', () => {
  it('defines 1.0 categories with at least 3 wording variants each', () => {
    expect(PUSH_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    for (const c of PUSH_CATEGORIES) {
      const variants = PUSH_COPY[c.id];
      expect(variants.length).toBeGreaterThanOrEqual(3);
      for (const v of variants) {
        expect(v.title.trim().length).toBeGreaterThan(0);
        expect(v.body.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('avoids immediate repeat when lastIndex is provided', () => {
    const first = pickPushCopy('streak', -1);
    const second = pickPushCopy('streak', first.index);
    if (PUSH_COPY.streak.length > 1) {
      expect(second.index).not.toBe(first.index);
    }
  });
});
