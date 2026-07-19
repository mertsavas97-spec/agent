import { findItem, itemsForExam, ITEM_BANK_SEED } from '@/src/data/itemBank';

describe('item bank seed (T069)', () => {
  it('has multiple seed items per exam and full catalog coverage', () => {
    expect(itemsForExam('lgs').length).toBeGreaterThanOrEqual(20);
    expect(itemsForExam('ygs').length).toBeGreaterThanOrEqual(20);
    expect(itemsForExam('kpss').length).toBeGreaterThanOrEqual(20);
    expect(ITEM_BANK_SEED.every((i) => i.explanationSteps.length >= 1)).toBe(true);
    expect(ITEM_BANK_SEED.length).toBeGreaterThanOrEqual(80);
  });

  it('finds sample by id', () => {
    const item = findItem('lgs-math-kesirler-001');
    expect(item?.answerKey).toBe('B');
    expect(item?.stem.length).toBeGreaterThan(10);
  });
});
