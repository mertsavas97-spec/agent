import {
  decideRewardedGrant,
  REWARDED_EXTRA_MAX_PER_DAY,
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

  it('caps at REWARDED_EXTRA_MAX_PER_DAY', () => {
    const state: QuotaState = {
      dailySolveCount: 5,
      dailySolveDate: today,
      subscriptionStatus: 'free',
      rewardedBonusCount: REWARDED_EXTRA_MAX_PER_DAY,
      rewardedBonusDate: today,
    };
    const { result } = decideRewardedGrant(state, today);
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('already_max');
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
