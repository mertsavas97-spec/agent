import { Alert } from 'react-native';

import { getAdEngine } from './adEngine';
import { shouldShowInterstitial } from './policy';
import { isPremiumAudience } from './premiumGate';
import { getAdDayCounters, markInterstitialShown } from './sessionStore';

/**
 * Free-only full-screen break when leaving a solution.
 * Premium skips. Stub engine + optional dogfood Alert so the gate is visible.
 */
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
  if (result === 'shown') {
    markInterstitialShown();
    if (__DEV__) {
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Reklam arası',
          'Ücretsiz planda çözüm bitince kısa bir tam ekran geçiş gösterilir. Premium’da yok.',
          [{ text: 'Devam', onPress: () => resolve() }],
          { cancelable: false },
        );
      });
    }
  }
  return result;
}
