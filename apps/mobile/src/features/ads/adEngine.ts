/**
 * Ad engine port — unavailable by default in production until AdMob ships.
 * Dogfood: EXPO_PUBLIC_ADS_STUB=1 keeps a stub that resolves rewarded/shown for QA.
 *
 * Do not statically import `react-native-google-mobile-ads` (breaks Expo Go).
 */

import {
  adsStubForced,
  hasProductionAdUnits,
  isAdMobNativeLinked,
  isLiveAdsDeliveryReady,
  resolveAdUnits,
} from './adUnits';

export type AdEngine = {
  ready: boolean;
  mode?: 'stub' | 'admob' | 'unavailable';
  showInterstitial: () => Promise<'shown' | 'skipped' | 'unavailable'>;
  showRewarded: () => Promise<'rewarded' | 'dismissed' | 'unavailable'>;
};

/** Dev/dogfood stub: no network ads; paths stay testable. */
export function createStubAdEngine(): AdEngine {
  return {
    ready: true,
    mode: 'stub',
    async showInterstitial() {
      return 'shown';
    },
    async showRewarded() {
      return 'rewarded';
    },
  };
}

/** Production without SDK/units — never fake a reward. */
export function createUnavailableAdEngine(): AdEngine {
  return {
    ready: false,
    mode: 'unavailable',
    async showInterstitial() {
      return 'unavailable';
    },
    async showRewarded() {
      return 'unavailable';
    },
  };
}

export function createAdEngine(): AdEngine {
  if (adsStubForced()) {
    return createStubAdEngine();
  }
  const units = resolveAdUnits();
  if (!hasProductionAdUnits(units) || !isAdMobNativeLinked()) {
    return createUnavailableAdEngine();
  }
  if (!isLiveAdsDeliveryReady(units)) {
    return createUnavailableAdEngine();
  }
  // Real AdMob wrappers land in adMobEngine.ts once wiring ships.
  console.info('ads: AdMob ids + native module present — enable adMobEngine wiring');
  return createUnavailableAdEngine();
}

let engine: AdEngine = createAdEngine();

export function getAdEngine(): AdEngine {
  return engine;
}

export function setAdEngineForTests(next: AdEngine): void {
  engine = next;
}

export function resetAdEngineFromEnv(): void {
  engine = createAdEngine();
}
