import {
  __resetRateLimitBucketsForTests,
  assertRateLimit,
} from '../src/abuse/rateLimit';
import {
  INVALID_RESTRICT_THRESHOLD,
  isTemporarilyRestricted,
  nextInvalidScore,
  restrictionAfterScore,
} from '../src/abuse/invalidImageScore';

describe('US7 abuse controls', () => {
  beforeEach(() => {
    __resetRateLimitBucketsForTests();
  });

  it('rate-limits burst calls within the window', () => {
    const key = 'solve:u1';
    for (let i = 0; i < 20; i++) {
      expect(() => assertRateLimit(key, { maxCalls: 20, windowMs: 60_000 }, 1_000 + i)).not.toThrow();
    }
    expect(() => assertRateLimit(key, { maxCalls: 20, windowMs: 60_000 }, 1_050)).toThrow(
      /RATE_LIMIT/,
    );
  });

  it('raises invalidImageScore on reject and restricts at threshold', () => {
    let score = 0;
    for (let i = 0; i < INVALID_RESTRICT_THRESHOLD; i++) {
      score = nextInvalidScore(score, true);
    }
    const state = restrictionAfterScore(score, 10_000);
    expect(state.invalidImageScore).toBe(INVALID_RESTRICT_THRESHOLD);
    expect(isTemporarilyRestricted(state, 10_001)).toBe(true);
    expect(isTemporarilyRestricted(state, 10_000 + 31 * 60 * 1000)).toBe(false);
  });

  it('decays score on clean accept', () => {
    expect(nextInvalidScore(3, false)).toBe(2);
  });
});
