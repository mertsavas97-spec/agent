import {
  canClaimMultiBatchUnlock,
  requiresRewardedForMultiBatch,
} from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markMultiBatchUnlock } from './sessionStore';
import { getAdEngine } from './adEngine';

/**
 * Gate multi-question batch for free users via one rewarded unlock.
 * Premium skips the ad. Stub engine marks local unlock (AdMob later).
 */
export async function runRewardedMultiBatchUnlock(): Promise<{
  allowed: boolean;
  rewarded: boolean;
  reason?: 'premium' | 'rewarded' | 'daily_cap' | 'dismissed';
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

  const result = await getAdEngine().showRewarded();
  if (result === 'rewarded') {
    markMultiBatchUnlock();
    return { allowed: true, rewarded: true, reason: 'rewarded' };
  }
  return { allowed: false, rewarded: false, reason: 'dismissed' };
}
