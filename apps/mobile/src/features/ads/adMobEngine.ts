/**
 * Live AdMob engine — dynamic require only (keeps Expo Go / Jest from hard-failing
 * when the native module is not linked).
 */

import { Platform } from 'react-native';

import type { AdEngine } from './adEngine';
import { GOOGLE_TEST_UNITS, type AdUnitSet } from './adUnits';

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
      // PG rating for education; under-age flag left off so new units can fill.
      // Age-band targeting can tighten later from onboarding consent.
      await ads.default().setRequestConfiguration({
        maxAdContentRating: ads.MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
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

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function loadAndShowRewarded(
  ads: AdsModule,
  unitId: string,
): Promise<'rewarded' | 'dismissed' | 'unavailable'> {
  const ad = ads.RewardedAd.createForAdRequest(unitId, REQUEST);
  let earned = false;
  try {
    // 1) Load until LOADED (do not show inside the load listener — clearer errors).
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        const unsubLoad = ad.addAdEventListener(ads.RewardedAdEventType.LOADED, () => {
          unsubLoad();
          unsubErr();
          resolve();
        });
        const unsubErr = ad.addAdEventListener(ads.AdEventType.ERROR, (e) => {
          unsubLoad();
          unsubErr();
          reject(e ?? new Error('rewarded_load_error'));
        });
        ad.load();
      }),
      LOAD_TIMEOUT_MS,
    );

    // 2) Present, then wait for close / reward.
    const closed = withTimeout(
      new Promise<void>((resolve, reject) => {
        const unsubs: (() => void)[] = [];
        const cleanup = () => unsubs.forEach((u) => u());
        unsubs.push(
          ad.addAdEventListener(ads.RewardedAdEventType.EARNED_REWARD, () => {
            earned = true;
          }),
        );
        unsubs.push(
          ad.addAdEventListener(ads.AdEventType.CLOSED, () => {
            cleanup();
            resolve();
          }),
        );
        unsubs.push(
          ad.addAdEventListener(ads.AdEventType.ERROR, (e) => {
            cleanup();
            reject(e ?? new Error('rewarded_show_error'));
          }),
        );
      }),
      LOAD_TIMEOUT_MS,
    );

    await ad.show();
    await closed;
    return earned ? 'rewarded' : 'dismissed';
  } catch (err) {
    console.warn('ads: rewarded failed', { unitId, err: errorMessage(err) });
    return 'unavailable';
  }
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
      } catch (err) {
        console.warn('ads: interstitial failed', errorMessage(err));
        return 'skipped';
      }
    },
    async showRewarded() {
      if (!rewardedId) return 'unavailable';
      try {
        await ensureInitialized(ads);
      } catch (err) {
        console.warn('ads: AdMob init failed', errorMessage(err));
        return 'unavailable';
      }

      const primary = await loadAndShowRewarded(ads, rewardedId);
      if (primary === 'rewarded' || primary === 'dismissed') {
        return primary;
      }

      // New live units often return no-fill; dogfood must still exercise the gate.
      if (__DEV__) {
        const testId =
          Platform.OS === 'ios'
            ? GOOGLE_TEST_UNITS.rewardedIos
            : GOOGLE_TEST_UNITS.rewardedAndroid;
        if (testId && testId !== rewardedId) {
          console.info('ads: rewarded no-fill — retry Google test unit');
          return loadAndShowRewarded(ads, testId);
        }
      }
      return 'unavailable';
    },
  };
}

/** Test helper */
export function __resetAdMobInitForTests(): void {
  initPromise = null;
}
