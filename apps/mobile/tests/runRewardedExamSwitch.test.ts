import { setAdEngineForTests, createStubAdEngine } from '@/src/features/ads/adEngine';
import { runRewardedExamSwitch } from '@/src/features/ads/runRewardedExamSwitch';

jest.mock('@/src/features/ads/premiumGate', () => ({
  isPremiumAudience: jest.fn(() => false),
}));

import { isPremiumAudience } from '@/src/features/ads/premiumGate';

describe('runRewardedExamSwitch', () => {
  afterEach(() => {
    setAdEngineForTests(createStubAdEngine());
    (isPremiumAudience as jest.Mock).mockReturnValue(false);
  });

  it('allows premium without ad', async () => {
    (isPremiumAudience as jest.Mock).mockReturnValue(true);
    await expect(runRewardedExamSwitch()).resolves.toEqual({
      allowed: true,
      reason: 'premium',
    });
  });

  it('requires rewarded completion for free users', async () => {
    setAdEngineForTests({
      ready: true,
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
});
