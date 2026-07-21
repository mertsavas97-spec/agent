import {
  FREE_DAILY_LIMIT,
  assertHasQuota,
  istanbulDate,
  remainingQuota,
  type QuotaState,
} from '../src/quota/dailyQuota';
import { makeMemoryCache } from '../src/cache/solutionCache';
import { createStubSolver } from '../src/solve/geminiSolve';
import { runSolveQuestion } from '../src/solve/solveQuestion';
import type { VisionClient } from '../src/moderation/visionClient';

const cleanVision: VisionClient = {
  source: 'stub',
  async safeSearch() {
    return { adult: 'VERY_UNLIKELY', violence: 'VERY_UNLIKELY', racy: 'VERY_UNLIKELY' };
  },
};

describe('daily quota (US6)', () => {
  it('exposes free daily limit of 5', () => {
    expect(FREE_DAILY_LIMIT).toBe(5);
  });

  it('returns remaining solves for free users on Istanbul day key', () => {
    const today = istanbulDate();
    const state: QuotaState = {
      dailySolveCount: 3,
      dailySolveDate: today,
      subscriptionStatus: 'free',
    };
    expect(remainingQuota(state, today)).toBe(2);
  });

  it('resets count when dailySolveDate is a previous Istanbul day', () => {
    const state: QuotaState = {
      dailySolveCount: 5,
      dailySolveDate: '2000-01-01',
      subscriptionStatus: 'free',
    };
    expect(remainingQuota(state, '2026-07-18')).toBe(FREE_DAILY_LIMIT);
  });

  it('throws QuotaExceededError when free daily limit is exhausted', () => {
    const today = '2026-07-18';
    const state: QuotaState = {
      dailySolveCount: FREE_DAILY_LIMIT,
      dailySolveDate: today,
      subscriptionStatus: 'free',
    };
    expect(() => assertHasQuota(state, today)).toThrow(/QUOTA_EXCEEDED/);
    try {
      assertHasQuota(state, today);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).name).toBe('QuotaExceededError');
    }
  });

  it('bypasses limit for active and grace entitlements', () => {
    const today = '2026-07-18';
    for (const subscriptionStatus of ['active', 'grace'] as const) {
      const state: QuotaState = {
        dailySolveCount: 99,
        dailySolveDate: today,
        subscriptionStatus,
      };
      expect(remainingQuota(state, today)).toBeGreaterThan(1000);
      expect(() => assertHasQuota(state, today)).not.toThrow();
    }
  });

  it('blocks solveQuestion when free quota is exhausted', async () => {
    const today = istanbulDate();
    await expect(
      runSolveQuestion(
        {
          uid: 'u-quota',
          imagePath: 'users/u-quota/uploads/1.jpg',
          imageBuffer: Buffer.from('quota-block'),
          examType: 'lgs',
        },
        {
          vision: cleanVision,
          solver: createStubSolver(),
          cache: makeMemoryCache(),
          loadQuota: async () => ({
            dailySolveCount: FREE_DAILY_LIMIT,
            dailySolveDate: today,
            subscriptionStatus: 'free',
          }),
          persistSolved: async () => ({ attemptId: 'a1', solutionId: 's1' }),
          persistRejected: async () => ({ attemptId: 'r1' }),
        },
      ),
    ).rejects.toMatchObject({ name: 'QuotaExceededError' });
  });

  it('allows solveQuestion when entitlement is active', async () => {
    const today = istanbulDate();
    const result = await runSolveQuestion(
      {
        uid: 'u-premium',
        imagePath: 'users/u-premium/uploads/1.jpg',
        imageBuffer: Buffer.from('premium-ok'),
        examType: 'lgs',
      },
      {
        vision: cleanVision,
        solver: createStubSolver(),
        cache: makeMemoryCache(),
        loadQuota: async () => ({
          dailySolveCount: 99,
          dailySolveDate: today,
          subscriptionStatus: 'active',
        }),
        persistSolved: async () => ({ attemptId: 'a2', solutionId: 's2' }),
        persistRejected: async () => ({ attemptId: 'r2' }),
      },
    );
    expect(result.status).toBe('solved');
  });
});
