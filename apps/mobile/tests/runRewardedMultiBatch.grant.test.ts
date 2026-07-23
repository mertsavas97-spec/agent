jest.mock('@/src/features/ads/grantRewardedSolveClient', () => ({
  callGrantRewardedSolve: jest.fn(),
}));

jest.mock('@/src/features/ads/premiumGate', () => ({
  isPremiumAudience: jest.fn(() => false),
}));

import { callGrantRewardedSolve } from '@/src/features/ads/grantRewardedSolveClient';
import {
  createStubAdEngine,
  resetAdEngineFromEnv,
  setAdEngineForTests,
} from '@/src/features/ads/adEngine';
import { runRewardedMultiBatchUnlock } from '@/src/features/ads/runRewardedMultiBatch';
import { __resetAdDayCountersForTests } from '@/src/features/ads/sessionStore';

describe('runRewardedMultiBatchUnlock', () => {
  const prevStub = process.env.EXPO_PUBLIC_ADS_STUB;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_ADS_STUB = '1';
    resetAdEngineFromEnv();
    setAdEngineForTests(createStubAdEngine());
    __resetAdDayCountersForTests();
    (callGrantRewardedSolve as jest.Mock).mockResolvedValue({
      ok: true,
      granted: true,
      reason: 'ok',
      remainingToday: 2,
      rewardedBonusToday: 2,
    });
  });

  afterEach(() => {
    if (prevStub === undefined) delete process.env.EXPO_PUBLIC_ADS_STUB;
    else process.env.EXPO_PUBLIC_ADS_STUB = prevStub;
    resetAdEngineFromEnv();
  });

  it('allows many free multi unlocks the same day and grants each time', async () => {
    for (let i = 0; i < 4; i += 1) {
      const outcome = await runRewardedMultiBatchUnlock();
      expect(outcome).toMatchObject({
        allowed: true,
        rewarded: true,
        granted: true,
        reason: 'rewarded',
      });
    }
    expect(callGrantRewardedSolve).toHaveBeenCalledTimes(4);
  });
});
