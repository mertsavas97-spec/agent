import {
  ADS_LIMITS,
  canClaimMultiBatchUnlock,
  requiresRewardedForMultiBatch,
} from '@/src/features/ads/policy';
import {
  MULTI_BATCH_MAX,
  clampBatchSize,
} from '@/src/features/solve/multiBatchPolicy';

describe('multi batch policy', () => {
  it('caps batch at 5', () => {
    expect(MULTI_BATCH_MAX).toBe(5);
    expect(ADS_LIMITS.multiBatchMax).toBe(5);
    expect(clampBatchSize(9)).toBe(5);
    expect(clampBatchSize(2)).toBe(2);
  });

  it('requires rewarded for free on every open, not only the first', () => {
    expect(requiresRewardedForMultiBatch({ isPremium: false, multiBatchUnlocksToday: 0 })).toBe(
      true,
    );
    expect(requiresRewardedForMultiBatch({ isPremium: false, multiBatchUnlocksToday: 1 })).toBe(
      true,
    );
    expect(requiresRewardedForMultiBatch({ isPremium: false, multiBatchUnlocksToday: 2 })).toBe(
      true,
    );
    expect(requiresRewardedForMultiBatch({ isPremium: true, multiBatchUnlocksToday: 0 })).toBe(
      false,
    );
  });

  it('enforces daily unlock cap for free', () => {
    expect(
      canClaimMultiBatchUnlock({
        isPremium: false,
        multiBatchUnlocksToday: ADS_LIMITS.rewardedMultiBatchMaxPerIstanbulDay,
      }),
    ).toBe(false);
    expect(
      canClaimMultiBatchUnlock({ isPremium: false, multiBatchUnlocksToday: 0 }),
    ).toBe(true);
  });
});
