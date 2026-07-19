import { findItem, itemsForExam, ITEM_BANK_SEED } from '@/src/data/itemBank';

describe('item bank seed (T069)', () => {
  it('has one seed item per exam', () => {
    expect(itemsForExam('lgs').length).toBeGreaterThanOrEqual(1);
    expect(itemsForExam('ygs').length).toBeGreaterThanOrEqual(1);
    expect(itemsForExam('kpss').length).toBeGreaterThanOrEqual(1);
    expect(ITEM_BANK_SEED.every((i) => i.explanationSteps.length >= 2)).toBe(true);
  });

  it('finds sample by id', () => {
    const item = findItem('lgs-math-kesirler-001');
    expect(item?.answerKey).toBe('B');
    expect(item?.stem.length).toBeGreaterThan(10);
  });
});
