/**
 * Ad engine port — swap StubAdEngine → AdMobEngine when EAS + 
 * react-native-google-mobile-ads is wired (see docs/product/ads-policy.md).
 *
 * Do not import `react-native-google-mobile-ads` here yet: breaks Expo Go.
 */

export type AdEngine = {
  ready: boolean;
  showInterstitial: () => Promise<'shown' | 'skipped' | 'unavailable'>;
  showRewarded: () => Promise<'rewarded' | 'dismissed' | 'unavailable'>;
};

/**
 * Dev/dogfood stub: no network ads. Interstitial resolves shown;
 * rewarded resolves rewarded so UI paths can be tested with
 * EXPO_PUBLIC_ADS_STUB=1 (default in __DEV__).
 */
export function createStubAdEngine(): AdEngine {
  return {
    ready: true,
    async showInterstitial() {
      return 'shown';
    },
    async showRewarded() {
      return 'rewarded';
    },
  };
}

let engine: AdEngine = createStubAdEngine();

export function getAdEngine(): AdEngine {
  return engine;
}

export function setAdEngineForTests(next: AdEngine): void {
  engine = next;
}
