import {
  _resetExplainRateLimitForTests,
  assertExplainRateLimit,
  demoExplanation,
  runExplainAgain,
} from '../src/solve/explainAgain';

describe('explainAgain', () => {
  beforeEach(() => {
    _resetExplainRateLimitForTests();
  });

  it('returns explanation without billing quota', async () => {
    const result = await runExplainAgain(
      { uid: 'u1', solutionId: 's1' },
      {
        assertExplainAllowed: (uid) => assertExplainRateLimit(uid),
        loadSolution: async () => ({
          stepsText: '1. Adım: Payda eşitle',
          topicId: 'lgs-math-kesirler',
          examType: 'lgs',
        }),
        generate: async ({ examType, priorSteps }) =>
          demoExplanation(examType, priorSteps),
        persistFollowUp: async () => ({ followUpId: 'f1' }),
      },
    );

    expect(result.billed).toBe(false);
    expect(result.followUpId).toBe('f1');
    expect(result.explanation).toContain('Daha sade');
  });

  it('rate limits excessive follow-ups', () => {
    for (let i = 0; i < 10; i += 1) {
      assertExplainRateLimit('u-rate');
    }
    expect(() => assertExplainRateLimit('u-rate')).toThrow(/RATE_LIMIT/);
  });
});
