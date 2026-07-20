import { getAdEngine } from './adEngine';
import { shouldOfferRewardedExtra } from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markRewardedClaimed } from './sessionStore';

/**
 * Watch rewarded → +1 solve (server grant TBD; stub marks local claim).
 * Returns whether a reward was earned.
 */
export async function runRewardedExtra(input: {
  freeRemainingToday: number;
}): Promise<{ offered: boolean; rewarded: boolean }> {
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
