import {
  advanceLiveCopy,
  liveCopyFor,
  progressForLivePhase,
  shouldCrawlProgress,
  statusLabelForPhase,
} from '@/src/features/solve/liveSolveCopy';

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

  it('never regresses live copy when stages fire out of order', () => {
    const solving = liveCopyFor('solving');
    expect(advanceLiveCopy(solving, 'ocr').phase).toBe('solving');
    expect(advanceLiveCopy(solving, 'finishing').phase).toBe('finishing');
  });

  it('crawls progress during OCR and solve waits', () => {
    expect(shouldCrawlProgress('ocr')).toBe(true);
    expect(shouldCrawlProgress('solving')).toBe(true);
    expect(shouldCrawlProgress('upload')).toBe(false);
  });

  it('surfaces OCR-specific status label', () => {
    expect(statusLabelForPhase('ocr')).toMatch(/Metin okunuyor/i);
  });
});
