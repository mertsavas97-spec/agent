import { callGrantRewardedSolve } from './grantRewardedSolveClient';
import { isDogfoodAdsStub, isLiveAdsDeliveryReady } from './adUnits';
import { getAdEngine } from './adEngine';
import {
  canClaimMultiBatchUnlock,
  requiresRewardedForMultiBatch,
} from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markMultiBatchUnlock } from './sessionStore';
import { AnalyticsEvents, track } from '@/src/lib/analytics';

/**
 * Gate multi-question batch for free users via one rewarded unlock per open.
 * No daily unlock ceiling — every free multi open can watch an ad and proceed.
 * Successful reward also grants +1 solve credit on the server.
 */
export async function runRewardedMultiBatchUnlock(): Promise<{
  allowed: boolean;
  rewarded: boolean;
  granted?: boolean;
  remainingToday?: number;
  reason?: 'premium' | 'rewarded' | 'dismissed' | 'ads_deferred';
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
    return { allowed: false, rewarded: false, reason: 'dismissed' };
  }

  if (!isDogfoodAdsStub() && !isLiveAdsDeliveryReady()) {
    markMultiBatchUnlock();
    return { allowed: true, rewarded: false, reason: 'ads_deferred' };
  }

  const result = await getAdEngine().showRewarded();
  if (result !== 'rewarded') {
    return { allowed: false, rewarded: false, reason: 'dismissed' };
  }

  markMultiBatchUnlock();
  const grant = await callGrantRewardedSolve();
  track(AnalyticsEvents.multiBatchUnlocked, {
    granted: grant.granted,
    remainingToday: grant.remainingToday ?? null,
  });
  return {
    allowed: true,
    rewarded: true,
    granted: grant.granted,
    remainingToday: grant.remainingToday,
    reason: 'rewarded',
  };
}
