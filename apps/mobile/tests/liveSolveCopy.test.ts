import { liveCopyFor, progressForLivePhase } from '@/src/features/solve/liveSolveCopy';

describe('liveSolveCopy', () => {
  it('returns pipeline-aware headlines for each phase', () => {
    expect(liveCopyFor('ocr').headline).toMatch(/Metin okunuyor/i);
    expect(liveCopyFor('solving').step).toBe('solve');
    expect(liveCopyFor('finishing').headline).toMatch(/Son dokunuş/i);
  });

  it('keeps progress monotonic across phases', () => {
    const phases = [
      'preparing',
      'upload',
      'ocr',
      'moderate',
      'solving',
      'finishing',
    ] as const;
    let prev = 0;
    for (const p of phases) {
      const next = progressForLivePhase(p);
      expect(next).toBeGreaterThanOrEqual(prev);
      prev = next;
    }
  });
});
