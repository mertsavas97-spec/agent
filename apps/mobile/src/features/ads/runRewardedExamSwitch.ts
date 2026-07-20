import { getAdEngine } from './adEngine';
import { isPremiumAudience } from './premiumGate';

/**
 * Mode switch gate: free users must finish one rewarded ad per switch.
 * Premium skips ads (reklamsız paket).
 */
export async function runRewardedExamSwitch(): Promise<{
  allowed: boolean;
  reason: 'premium' | 'rewarded' | 'dismissed' | 'unavailable';
}> {
  if (isPremiumAudience()) {
    return { allowed: true, reason: 'premium' };
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
