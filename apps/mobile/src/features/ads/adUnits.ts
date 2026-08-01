/**
 * AdMob / stub unit IDs — production values via EAS profile env (`eas.json`)
 * or owner export; prefer not to commit secrets-like tokens in `.env` files.
 * Google test ids used when EXPO_PUBLIC_ADS_USE_TEST_UNITS=1.
 */

import { Platform } from 'react-native';

export type AdUnitSet = {
  androidAppId: string | null;
  iosAppId: string | null;
  bannerAndroid: string | null;
  bannerIos: string | null;
  interstitialAndroid: string | null;
  interstitialIos: string | null;
  rewardedAndroid: string | null;
  rewardedIos: string | null;
};

/** Google sample unit ids — safe for dogfood builds. */
export const GOOGLE_TEST_UNITS: AdUnitSet = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  bannerAndroid: 'ca-app-pub-3940256099942544/6300978111',
  bannerIos: 'ca-app-pub-3940256099942544/2934735716',
  interstitialAndroid: 'ca-app-pub-3940256099942544/1033173712',
  interstitialIos: 'ca-app-pub-3940256099942544/4411468910',
  rewardedAndroid: 'ca-app-pub-3940256099942544/5224354917',
  rewardedIos: 'ca-app-pub-3940256099942544/1712485313',
};

/**
 * Canonical ÇözBil iOS live units (AdMob → Uygulama ayarları / Reklam birimleri).
 * Confirmed 2026-08-01 against owner dashboard screenshots.
 */
export const COZBIL_IOS_LIVE_UNITS = {
  iosAppId: 'ca-app-pub-4628962707131944~6347757786',
  bannerIos: 'ca-app-pub-4628962707131944/1521648962',
  interstitialIos: 'ca-app-pub-4628962707131944/3447425993',
  rewardedIos: 'ca-app-pub-4628962707131944/8645460517',
} as const;

/**
 * Canonical ÇözBil Android live units (AdMob → Uygulama ayarları / Reklam birimleri).
 * Confirmed 2026-08-01 against owner dashboard screenshots.
 */
export const COZBIL_ANDROID_LIVE_UNITS = {
  androidAppId: 'ca-app-pub-4628962707131944~2989418548',
  bannerAndroid: 'ca-app-pub-4628962707131944/6509861155',
  interstitialAndroid: 'ca-app-pub-4628962707131944/5332510855',
  rewardedAndroid: 'ca-app-pub-4628962707131944/7655421864',
} as const;

function env(key: string): string | null {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : null;
}

export function resolveAdUnits(): AdUnitSet {
  if (process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS === '1') {
    return GOOGLE_TEST_UNITS;
  }
  return {
    androidAppId:
      env('EXPO_PUBLIC_ADMOB_ANDROID_APP_ID') ?? COZBIL_ANDROID_LIVE_UNITS.androidAppId,
    iosAppId: env('EXPO_PUBLIC_ADMOB_IOS_APP_ID') ?? COZBIL_IOS_LIVE_UNITS.iosAppId,
    bannerAndroid:
      env('EXPO_PUBLIC_ADMOB_BANNER_ANDROID') ?? COZBIL_ANDROID_LIVE_UNITS.bannerAndroid,
    bannerIos: env('EXPO_PUBLIC_ADMOB_BANNER_IOS') ?? COZBIL_IOS_LIVE_UNITS.bannerIos,
    interstitialAndroid:
      env('EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID') ??
      COZBIL_ANDROID_LIVE_UNITS.interstitialAndroid,
    interstitialIos:
      env('EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS') ?? COZBIL_IOS_LIVE_UNITS.interstitialIos,
    rewardedAndroid:
      env('EXPO_PUBLIC_ADMOB_REWARDED_ANDROID') ?? COZBIL_ANDROID_LIVE_UNITS.rewardedAndroid,
    rewardedIos:
      env('EXPO_PUBLIC_ADMOB_REWARDED_IOS') ?? COZBIL_IOS_LIVE_UNITS.rewardedIos,
  };
}

/** Safe for Metro logs — full unit ids (not secrets). */
export function diagnoseAdsConfig(): {
  stub: boolean;
  liveReady: boolean;
  nativeLinked: boolean;
  iosAppId: string | null;
  rewardedIos: string | null;
  bannerIos: string | null;
} {
  const units = resolveAdUnits();
  return {
    stub: adsStubForced(),
    liveReady: isLiveAdsDeliveryReady(units),
    nativeLinked: isAdMobNativeLinked(),
    iosAppId: units.iosAppId,
    rewardedIos: units.rewardedIos,
    bannerIos: units.bannerIos,
  };
}

export function adsStubForced(): boolean {
  return process.env.EXPO_PUBLIC_ADS_STUB === '1';
}

/** True when enough ids exist for the current platform (iOS≠Android units). */
export function hasProductionAdUnits(units: AdUnitSet = resolveAdUnits()): boolean {
  const os = Platform.OS;
  if (os === 'ios') {
    return Boolean(units.bannerIos && units.interstitialIos && units.rewardedIos);
  }
  if (os === 'android') {
    return Boolean(
      units.bannerAndroid && units.interstitialAndroid && units.rewardedAndroid,
    );
  }
  // web / unknown — treat as not ready
  return false;
}

/** Native AdMob module linked (optional peer). */
export function isAdMobNativeLinked(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-google-mobile-ads');
    return true;
  } catch {
    return false;
  }
}

/**
 * Live store ads: real unit ids for this OS + native SDK, and stub flag off.
 * Until then: hide banner placeholders; do not fake store ads.
 */
export function isLiveAdsDeliveryReady(
  units: AdUnitSet = resolveAdUnits(),
): boolean {
  if (adsStubForced()) return false;
  return hasProductionAdUnits(units) && isAdMobNativeLinked();
}

/** Dogfood QA may keep stub rewarded/interstitial paths. */
export function isDogfoodAdsStub(): boolean {
  return adsStubForced();
}
