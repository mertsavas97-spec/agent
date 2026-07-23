import { isDogfoodAdsStub, isLiveAdsDeliveryReady } from './adUnits';
import { getAdEngine } from './adEngine';
import {
  canClaimMultiBatchUnlock,
  requiresRewardedForMultiBatch,
} from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markMultiBatchUnlock } from './sessionStore';

/**
 * Gate multi-question batch for free users via one rewarded unlock.
 * Premium skips the ad. Until live AdMob ships, free users are not blocked
 * by a missing SDK (ads_deferred). Dogfood stub still exercises the path.
 */
export async function runRewardedMultiBatchUnlock(): Promise<{
  allowed: boolean;
  rewarded: boolean;
  reason?: 'premium' | 'rewarded' | 'daily_cap' | 'dismissed' | 'ads_deferred';
}> {
  const isPremium = isPremiumAudience();
  const day = getAdDayCounters();
  const ctx = {
    isPremium,
    multiBatchUnlocksToday: day.multiBatchUnlocks,
  };

  if (!requiresRewardedForMultiBatch(ctx)) {
    return { allowed: true, rewarded: false, reason: 'premium' };
  }
  if (!canClaimMultiBatchUnlock(ctx)) {
    return { allowed: false, rewarded: false, reason: 'daily_cap' };
  }

  if (!isDogfoodAdsStub() && !isLiveAdsDeliveryReady()) {
    markMultiBatchUnlock();
    return { allowed: true, rewarded: false, reason: 'ads_deferred' };
  }

  const result = await getAdEngine().showRewarded();
  if (result === 'rewarded') {
    markMultiBatchUnlock();
    return { allowed: true, rewarded: true, reason: 'rewarded' };
  }
  return { allowed: false, rewarded: false, reason: 'dismissed' };
}
