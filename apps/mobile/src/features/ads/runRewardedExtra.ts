import { callGrantRewardedSolve } from './grantRewardedSolveClient';
import { isDogfoodAdsStub, isLiveAdsDeliveryReady } from './adUnits';
import { getAdEngine } from './adEngine';
import { shouldOfferRewardedExtra } from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markRewardedClaimed } from './sessionStore';
import { AnalyticsEvents, track } from '@/src/lib/analytics';

/**
 * Watch rewarded → +1 solve via grantRewardedSolve callable.
 * No daily product cap. Hidden when live ads are not ready.
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
  if (grant.granted) {
    track(AnalyticsEvents.rewardedExtraGranted, {
      remainingToday: grant.remainingToday ?? null,
      source: 'paywall_extra',
    });
  }
  return {
    offered: true,
    rewarded: true,
    granted: grant.granted,
    grantReason: grant.reason,
    remainingToday: grant.remainingToday,
  };
}
