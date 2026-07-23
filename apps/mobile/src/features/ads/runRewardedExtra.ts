import { callGrantRewardedSolve } from './grantRewardedSolveClient';
import { isDogfoodAdsStub, isLiveAdsDeliveryReady } from './adUnits';
import { getAdEngine } from './adEngine';
import { shouldOfferRewardedExtra } from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markRewardedClaimed } from './sessionStore';

/**
 * Watch rewarded → +1 solve via grantRewardedSolve callable.
 * Hidden when live ads are not ready (no fake store rewards).
 * Dogfood stub still exercises the path and attempts server grant when signed in.
 */
export async function runRewardedExtra(input: {
  freeRemainingToday: number;
}): Promise<{
  offered: boolean;
  rewarded: boolean;
  granted?: boolean;
  grantReason?: string;
  remainingToday?: number;
}> {
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
  if (result !== 'rewarded') {
    return { offered: true, rewarded: false };
  }

  markRewardedClaimed();
  const grant = await callGrantRewardedSolve();
  return {
    offered: true,
    rewarded: true,
    granted: grant.granted,
    grantReason: grant.reason,
    remainingToday: grant.remainingToday,
  };
}
