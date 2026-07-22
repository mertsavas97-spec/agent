/**
 * Ad engine port — Stub by default; AdMob when native SDK + unit ids are present.
 *
 * Do not statically import `react-native-google-mobile-ads` (breaks Expo Go).
 * Production: set EXPO_PUBLIC_ADS_STUB=0, install SDK via EAS prebuild, set unit ids.
 */

import { adsStubForced, hasProductionAdUnits, resolveAdUnits } from './adUnits';

export type AdEngine = {
  ready: boolean;
  mode?: 'stub' | 'admob';
  showInterstitial: () => Promise<'shown' | 'skipped' | 'unavailable'>;
  showRewarded: () => Promise<'rewarded' | 'dismissed' | 'unavailable'>;
};

/**
 * Dev/dogfood stub: no network ads. Interstitial resolves shown;
 * rewarded resolves rewarded so UI paths can be tested.
 */
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

/**
 * Optional AdMob engine — only loads when SDK is linked and units configured.
 * Until then returns stub so dogfood builds keep working.
 */
export function createAdEngine(): AdEngine {
  if (adsStubForced()) {
    return createStubAdEngine();
  }
  const units = resolveAdUnits();
  if (!hasProductionAdUnits(units)) {
    return createStubAdEngine();
  }
  try {
    // Optional peer — absent until EAS + npm install react-native-google-mobile-ads.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-google-mobile-ads');
    // Real AdMob wrappers land in adMobEngine.ts once the native module ships.
    // Until then keep stub behavior but mark readiness gap in logs.
    console.info(
      'ads: AdMob package present + unit ids set — enable adMobEngine wiring after native rebuild',
    );
    return createStubAdEngine();
  } catch {
    return createStubAdEngine();
  }
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
