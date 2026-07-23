/**
 * Live AdMob engine — dynamic require only (keeps Expo Go / Jest from hard-failing
 * when the native module is not linked).
 */

import { Platform } from 'react-native';

import type { AdEngine } from './adEngine';
import type { AdUnitSet } from './adUnits';

type AdsModule = {
  default: () => {
    setRequestConfiguration: (cfg: Record<string, unknown>) => Promise<void>;
    initialize: () => Promise<unknown>;
  };
  MaxAdContentRating: { G: string; PG: string; T: string; MA: string };
  AdEventType: { LOADED: string; ERROR: string; CLOSED: string };
  RewardedAdEventType: { LOADED: string; EARNED_REWARD: string };
  InterstitialAd: {
    createForAdRequest: (
      unitId: string,
      opts?: Record<string, unknown>,
    ) => {
      addAdEventListener: (event: string, cb: (payload?: unknown) => void) => () => void;
      load: () => void;
      show: () => Promise<void>;
    };
  };
  RewardedAd: {
    createForAdRequest: (
      unitId: string,
      opts?: Record<string, unknown>,
    ) => {
      addAdEventListener: (event: string, cb: (payload?: unknown) => void) => () => void;
      load: () => void;
      show: () => Promise<void>;
    };
  };
};

let initPromise: Promise<void> | null = null;

function loadAdsModule(): AdsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads') as AdsModule;
  } catch {
    return null;
  }
}

async function ensureInitialized(ads: AdsModule): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      // Education / LGS minors — conservative content + non-personalized bias.
      await ads.default().setRequestConfiguration({
        maxAdContentRating: ads.MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: true,
      });
      await ads.default().initialize();
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

function unitFor(
  units: AdUnitSet,
  kind: 'interstitial' | 'rewarded',
): string | null {
  if (Platform.OS === 'ios') {
    return kind === 'interstitial' ? units.interstitialIos : units.rewardedIos;
  }
  return kind === 'interstitial' ? units.interstitialAndroid : units.rewardedAndroid;
}

const REQUEST = { requestNonPersonalizedAdsOnly: true } as const;
const LOAD_TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('ad_load_timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * Build a live AdMob engine, or null if the native module cannot initialize.
 */
export function tryCreateAdMobEngine(units: AdUnitSet): AdEngine | null {
  const ads = loadAdsModule();
  if (!ads) return null;

  const interstitialId = unitFor(units, 'interstitial');
  const rewardedId = unitFor(units, 'rewarded');
  if (!interstitialId && !rewardedId) return null;

  return {
    ready: true,
    mode: 'admob',
    async showInterstitial() {
      if (!interstitialId) return 'unavailable';
      try {
        await ensureInitialized(ads);
        const ad = ads.InterstitialAd.createForAdRequest(interstitialId, REQUEST);
        await withTimeout(
          new Promise<void>((resolve, reject) => {
            const unsubLoad = ad.addAdEventListener(ads.AdEventType.LOADED, () => {
              unsubLoad();
              unsubErr();
              resolve();
            });
            const unsubErr = ad.addAdEventListener(ads.AdEventType.ERROR, (e) => {
              unsubLoad();
              unsubErr();
              reject(e ?? new Error('interstitial_error'));
            });
            ad.load();
          }),
          LOAD_TIMEOUT_MS,
        );
        await ad.show();
        return 'shown';
      } catch {
        return 'skipped';
      }
    },
    async showRewarded() {
      if (!rewardedId) return 'unavailable';
      try {
        await ensureInitialized(ads);
        const ad = ads.RewardedAd.createForAdRequest(rewardedId, REQUEST);
        let earned = false;
        await withTimeout(
          new Promise<void>((resolve, reject) => {
            const unsubs: (() => void)[] = [];
            unsubs.push(
              ad.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
                void ad.show().catch(reject);
              }),
            );
            unsubs.push(
              ad.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => {
                earned = true;
              }),
            );
            unsubs.push(
              ad.addAdEventListener(ads.AdEventType.CLOSED, () => {
                unsubs.forEach((u) => u());
                resolve();
              }),
            );
            unsubs.push(
              ad.addAdEventListener(ads.AdEventType.ERROR, (e) => {
                unsubs.forEach((u) => u());
                reject(e ?? new Error('rewarded_error'));
              }),
            );
            ad.load();
          }),
          LOAD_TIMEOUT_MS,
        );
        return earned ? 'rewarded' : 'dismissed';
      } catch {
        return 'dismissed';
      }
    },
  };
}

/** Test helper */
export function __resetAdMobInitForTests(): void {
  initPromise = null;
}
