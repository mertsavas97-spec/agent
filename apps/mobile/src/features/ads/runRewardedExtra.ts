import { isDogfoodAdsStub, isLiveAdsDeliveryReady } from './adUnits';
import { getAdEngine } from './adEngine';
import { shouldOfferRewardedExtra } from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markRewardedClaimed } from './sessionStore';

/**
 * Watch rewarded → +1 solve (server grant TBD; stub marks local claim in dogfood).
 * Hidden when live ads are not ready (no fake store rewards).
 */
export async function runRewardedExtra(input: {
  freeRemainingToday: number;
}): Promise<{ offered: boolean; rewarded: boolean }> {
  if (!isDogfoodAdsStub() && !isLiveAdsDeliveryReady()) {
    return { offered: false, rewarded: false };
  }

  const day = getAdDayCounters();
  const offered = shouldOfferRewardedExtra({
    isPremium: isPremiumAudience(),
    freeRemainingToday: input.freeRemainingToday,
    rewardedClaimedToday: day.rewardedClaimed,
  });
  if (!offered) return { offered: false, rewarded: false };

  const result = await getAdEngine().showRewarded();
  if (result === 'rewarded') {
    markRewardedClaimed();
    return { offered: true, rewarded: true };
  }
  return { offered: true, rewarded: false };
}
