import {
  ADS_LIMITS,
  adsAllowedOnSurface,
  canClaimMultiBatchUnlock,
  requiresRewardedForMultiBatch,
  shouldOfferRewardedExtra,
  shouldShowBanner,
  shouldShowInterstitial,
} from '@/src/features/ads/policy';

describe('ads policy', () => {
  it('disables all ad surfaces for Premium', () => {
    expect(shouldShowBanner({ isPremium: true })).toBe(false);
    expect(
      shouldShowInterstitial({
        isPremium: true,
        billedSolvesToday: 5,
        interstitialShownToday: 0,
        atNaturalBreak: true,
      }),
    ).toBe(false);
    expect(
      shouldOfferRewardedExtra({
        isPremium: true,
        freeRemainingToday: 0,
        rewardedClaimedToday: 0,
      }),
    ).toBe(false);
  });

  it('shows banner only for free audience', () => {
    expect(shouldShowBanner({ isPremium: false })).toBe(true);
  });

  it('allows interstitial after first billed solve at natural break (free leave)', () => {
    expect(
      shouldShowInterstitial({
        isPremium: false,
        billedSolvesToday: 0,
        interstitialShownToday: 0,
        atNaturalBreak: true,
      }),
    ).toBe(false);
    expect(
      shouldShowInterstitial({
        isPremium: false,
        billedSolvesToday: 1,
        interstitialShownToday: 0,
        atNaturalBreak: true,
      }),
    ).toBe(true);
    expect(
      shouldShowInterstitial({
        isPremium: false,
        billedSolvesToday: 1,
        interstitialShownToday: 0,
        atNaturalBreak: false,
      }),
    ).toBe(false);
    expect(
      shouldShowInterstitial({
        isPremium: false,
        billedSolvesToday: 5,
        interstitialShownToday: ADS_LIMITS.interstitialMaxPerIstanbulDay,
        atNaturalBreak: true,
      }),
    ).toBe(false);
  });

  it('requires rewarded for every free multi-batch open with no daily unlock ceiling', () => {
    expect(
      requiresRewardedForMultiBatch({ isPremium: false, multiBatchUnlocksToday: 0 }),
    ).toBe(true);
    expect(
      requiresRewardedForMultiBatch({ isPremium: false, multiBatchUnlocksToday: 99 }),
    ).toBe(true);
    expect(
      requiresRewardedForMultiBatch({ isPremium: true, multiBatchUnlocksToday: 0 }),
    ).toBe(false);
    expect(
      canClaimMultiBatchUnlock({
        isPremium: false,
        multiBatchUnlocksToday: 99,
      }),
    ).toBe(true);
  });

  it('offers rewarded whenever free quota is exhausted (no daily max)', () => {
    expect(
      shouldOfferRewardedExtra({
        isPremium: false,
        freeRemainingToday: 2,
        rewardedClaimedToday: 0,
      }),
    ).toBe(false);
    expect(
      shouldOfferRewardedExtra({
        isPremium: false,
        freeRemainingToday: 0,
        rewardedClaimedToday: 0,
      }),
    ).toBe(true);
    expect(
      shouldOfferRewardedExtra({
        isPremium: false,
        freeRemainingToday: 0,
        rewardedClaimedToday: 99,
      }),
    ).toBe(true);
  });

  it('forbids ads on solve and onboarding surfaces', () => {
    expect(adsAllowedOnSurface('tabs')).toBe(true);
    expect(adsAllowedOnSurface('solve')).toBe(false);
    expect(adsAllowedOnSurface('onboarding')).toBe(false);
  });
});
