import { getAdEngine } from './adEngine';
import { shouldShowInterstitial } from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markInterstitialShown } from './sessionStore';

export async function runInterstitialIfNeeded(input: {
  billedSolvesToday: number;
  atNaturalBreak: boolean;
}): Promise<'shown' | 'skipped' | 'unavailable'> {
  const day = getAdDayCounters();
  const allowed = shouldShowInterstitial({
    isPremium: isPremiumAudience(),
    billedSolvesToday: input.billedSolvesToday,
    interstitialShownToday: day.interstitialShown,
    atNaturalBreak: input.atNaturalBreak,
  });
  if (!allowed) return 'skipped';

  const result = await getAdEngine().showInterstitial();
  if (result === 'shown') markInterstitialShown();
  return result;
}
