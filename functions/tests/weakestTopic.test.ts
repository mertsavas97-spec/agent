import { selectWeakestTopic } from '../src/progress/weakestTopic';

describe('selectWeakestTopic', () => {
  it('picks highest followUpCount', () => {
    const weakest = selectWeakestTopic([
      { topicId: 'a', nameTr: 'A', attemptCount: 10, followUpCount: 1 },
      { topicId: 'b', nameTr: 'B', attemptCount: 3, followUpCount: 5 },
    ]);
    expect(weakest?.topicId).toBe('b');
  });

  it('tie-breaks by lower attemptCount', () => {
    const weakest = selectWeakestTopic([
      { topicId: 'x', nameTr: 'X', attemptCount: 8, followUpCount: 2 },
      { topicId: 'y', nameTr: 'Y', attemptCount: 2, followUpCount: 2 },
    ]);
    expect(weakest?.topicId).toBe('y');
  });

  it('returns null for empty', () => {
    expect(selectWeakestTopic([])).toBeNull();
  });
});
