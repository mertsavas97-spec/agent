import {
  decideRewardedGrant,
} from '../src/quota/grantRewardedSolve';
import { remainingQuota, type QuotaState } from '../src/quota/dailyQuota';

describe('grantRewardedSolve', () => {
  const today = '2026-07-23';

  it('grants +1 bonus and increases remaining', () => {
    const state: QuotaState = {
      dailySolveCount: 5,
      dailySolveDate: today,
      subscriptionStatus: 'free',
      rewardedBonusCount: 0,
      rewardedBonusDate: null,
    };
    expect(remainingQuota(state, today)).toBe(0);
    const { next, result } = decideRewardedGrant(state, today);
    expect(result.granted).toBe(true);
    expect(result.reason).toBe('ok');
    expect(result.rewardedBonusToday).toBe(1);
    expect(remainingQuota(next, today)).toBe(1);
  });

  it('allows many grants the same Istanbul day (no product daily max)', () => {
    let state: QuotaState = {
      dailySolveCount: 5,
      dailySolveDate: today,
      subscriptionStatus: 'free',
      rewardedBonusCount: 0,
      rewardedBonusDate: null,
    };
    for (let i = 1; i <= 5; i += 1) {
      const { next, result } = decideRewardedGrant(state, today);
      expect(result.granted).toBe(true);
      expect(result.rewardedBonusToday).toBe(i);
      state = next;
    }
    expect(remainingQuota(state, today)).toBe(5);
  });

  it('skips grant for premium', () => {
    const state: QuotaState = {
      dailySolveCount: 0,
      dailySolveDate: today,
      subscriptionStatus: 'active',
    };
    const { result } = decideRewardedGrant(state, today);
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('premium');
  });

  it('resets bonus on a new Istanbul day', () => {
    const state: QuotaState = {
      dailySolveCount: 5,
      dailySolveDate: today,
      subscriptionStatus: 'free',
      rewardedBonusCount: 2,
      rewardedBonusDate: '2026-07-22',
    };
    const { next, result } = decideRewardedGrant(state, today);
    expect(result.granted).toBe(true);
    expect(next.rewardedBonusCount).toBe(1);
    expect(next.rewardedBonusDate).toBe(today);
  });
});
