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
import { runRewardedExtra } from '@/src/features/ads/runRewardedExtra';
import { __resetAdDayCountersForTests } from '@/src/features/ads/sessionStore';

describe('runRewardedExtra server grant', () => {
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
      remainingToday: 1,
      rewardedBonusToday: 1,
    });
  });

  afterEach(() => {
    if (prevStub === undefined) delete process.env.EXPO_PUBLIC_ADS_STUB;
    else process.env.EXPO_PUBLIC_ADS_STUB = prevStub;
    resetAdEngineFromEnv();
  });

  it('calls grantRewardedSolve after a completed reward', async () => {
    const outcome = await runRewardedExtra({ freeRemainingToday: 0 });
    expect(outcome).toMatchObject({
      offered: true,
      rewarded: true,
      granted: true,
      remainingToday: 1,
    });
    expect(callGrantRewardedSolve).toHaveBeenCalled();
  });
});
