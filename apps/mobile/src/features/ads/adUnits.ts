/**
 * AdMob / stub unit IDs — production secrets via EAS env, never commit real prod ids.
 * Google test ids used when EXPO_PUBLIC_ADS_USE_TEST_UNITS=1.
 */

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

function env(key: string): string | null {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : null;
}

export function resolveAdUnits(): AdUnitSet {
  if (process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS === '1') {
    return GOOGLE_TEST_UNITS;
  }
  return {
    androidAppId: env('EXPO_PUBLIC_ADMOB_ANDROID_APP_ID'),
    iosAppId: env('EXPO_PUBLIC_ADMOB_IOS_APP_ID'),
    bannerAndroid: env('EXPO_PUBLIC_ADMOB_BANNER_ANDROID'),
    bannerIos: env('EXPO_PUBLIC_ADMOB_BANNER_IOS'),
    interstitialAndroid: env('EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID'),
    interstitialIos: env('EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS'),
    rewardedAndroid: env('EXPO_PUBLIC_ADMOB_REWARDED_ANDROID'),
    rewardedIos: env('EXPO_PUBLIC_ADMOB_REWARDED_IOS'),
  };
}

export function adsStubForced(): boolean {
  return process.env.EXPO_PUBLIC_ADS_STUB === '1';
}

/** True when enough ids exist to attempt a real SDK path later. */
export function hasProductionAdUnits(units: AdUnitSet = resolveAdUnits()): boolean {
  return Boolean(
    (units.bannerAndroid || units.bannerIos) &&
      (units.interstitialAndroid || units.interstitialIos) &&
      (units.rewardedAndroid || units.rewardedIos),
  );
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
 * Live store ads: real unit ids + native SDK, and stub flag off.
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
