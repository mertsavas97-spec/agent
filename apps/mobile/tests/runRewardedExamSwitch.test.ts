import {
  createStubAdEngine,
  resetAdEngineFromEnv,
  setAdEngineForTests,
} from '@/src/features/ads/adEngine';
import { runRewardedExamSwitch } from '@/src/features/ads/runRewardedExamSwitch';

jest.mock('@/src/features/ads/premiumGate', () => ({
  isPremiumAudience: jest.fn(() => false),
}));

import { isPremiumAudience } from '@/src/features/ads/premiumGate';

describe('runRewardedExamSwitch', () => {
  const prevStub = process.env.EXPO_PUBLIC_ADS_STUB;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_ADS_STUB = '1';
    resetAdEngineFromEnv();
    (isPremiumAudience as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    if (prevStub === undefined) delete process.env.EXPO_PUBLIC_ADS_STUB;
    else process.env.EXPO_PUBLIC_ADS_STUB = prevStub;
    resetAdEngineFromEnv();
    (isPremiumAudience as jest.Mock).mockReturnValue(false);
  });

  it('allows premium without ad', async () => {
    (isPremiumAudience as jest.Mock).mockReturnValue(true);
    await expect(runRewardedExamSwitch()).resolves.toEqual({
      allowed: true,
      reason: 'premium',
    });
  });

  it('requires rewarded completion for free users in dogfood stub', async () => {
    setAdEngineForTests({
      ready: true,
      mode: 'stub',
      showInterstitial: async () => 'shown',
      showRewarded: async () => 'dismissed',
    });
    await expect(runRewardedExamSwitch()).resolves.toEqual({
      allowed: false,
      reason: 'dismissed',
    });

    setAdEngineForTests(createStubAdEngine());
    await expect(runRewardedExamSwitch()).resolves.toEqual({
      allowed: true,
      reason: 'rewarded',
    });
  });

  it('defers ads (allows switch) when live AdMob is not ready', async () => {
    delete process.env.EXPO_PUBLIC_ADS_STUB;
    resetAdEngineFromEnv();
    await expect(runRewardedExamSwitch()).resolves.toEqual({
      allowed: true,
      reason: 'ads_deferred',
    });
  });
});
