import { isDogfoodAdsStub, isLiveAdsDeliveryReady } from './adUnits';
import { getAdEngine } from './adEngine';
import { isPremiumAudience } from './premiumGate';

/**
 * Mode switch gate: free users must finish one rewarded ad per switch.
 * Premium skips ads. Until live AdMob ships, free switch is not blocked.
 */
export async function runRewardedExamSwitch(): Promise<{
  allowed: boolean;
  reason: 'premium' | 'rewarded' | 'dismissed' | 'unavailable' | 'ads_deferred';
}> {
  if (isPremiumAudience()) {
    return { allowed: true, reason: 'premium' };
  }
  if (!isDogfoodAdsStub() && !isLiveAdsDeliveryReady()) {
    return { allowed: true, reason: 'ads_deferred' };
  }
  const result = await getAdEngine().showRewarded();
  if (result === 'rewarded') {
    return { allowed: true, reason: 'rewarded' };
  }
  return {
    allowed: false,
    reason: result === 'unavailable' ? 'unavailable' : 'dismissed',
  };
}
