import { isLiveAdsDeliveryReady } from './adUnits';

/**
 * Warm the native AdMob SDK early so the first rewarded/banner is not cold.
 * No-op when units/SDK are missing (Expo Go / stub builds).
 */
export function warmAdMob(): void {
  if (!isLiveAdsDeliveryReady()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ads = require('react-native-google-mobile-ads') as {
      default: () => { initialize: () => Promise<unknown> };
      MaxAdContentRating: { PG: string };
    };
    void ads
      .default()
      .initialize()
      .then(() => {
        if (__DEV__) console.info('ads: AdMob warmed');
      })
      .catch((err: unknown) => {
        console.warn('ads: AdMob warm failed', err);
      });
  } catch {
    // Native module not linked
  }
}
