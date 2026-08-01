import {
  COZBIL_ANDROID_LIVE_UNITS,
  COZBIL_IOS_LIVE_UNITS,
  GOOGLE_TEST_UNITS,
  adsStubForced,
  hasProductionAdUnits,
  isDogfoodAdsStub,
  isLiveAdsDeliveryReady,
  resolveAdUnits,
} from '@/src/features/ads/adUnits';
import {
  createAdEngine,
  createStubAdEngine,
  createUnavailableAdEngine,
} from '@/src/features/ads/adEngine';

describe('ad units + engine readiness', () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of [
      'EXPO_PUBLIC_ADS_STUB',
      'EXPO_PUBLIC_ADS_USE_TEST_UNITS',
      'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID',
      'EXPO_PUBLIC_ADMOB_BANNER_ANDROID',
      'EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID',
      'EXPO_PUBLIC_ADMOB_REWARDED_ANDROID',
      'EXPO_PUBLIC_ADMOB_IOS_APP_ID',
      'EXPO_PUBLIC_ADMOB_BANNER_IOS',
      'EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS',
      'EXPO_PUBLIC_ADMOB_REWARDED_IOS',
    ]) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('uses Google test units when EXPO_PUBLIC_ADS_USE_TEST_UNITS=1', () => {
    process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS = '1';
    expect(resolveAdUnits()).toEqual(GOOGLE_TEST_UNITS);
    expect(hasProductionAdUnits()).toBe(true);
  });

  it('defaults iOS live units to AdMob dashboard ids (owner screenshot)', () => {
    const units = resolveAdUnits();
    expect(units.iosAppId).toBe(COZBIL_IOS_LIVE_UNITS.iosAppId);
    expect(units.bannerIos).toBe(COZBIL_IOS_LIVE_UNITS.bannerIos);
    expect(units.interstitialIos).toBe(COZBIL_IOS_LIVE_UNITS.interstitialIos);
    expect(units.rewardedIos).toBe(COZBIL_IOS_LIVE_UNITS.rewardedIos);
    expect(units.iosAppId).toBe('ca-app-pub-4628962707131944~6347757786');
    expect(units.rewardedIos).toBe('ca-app-pub-4628962707131944/8645460517');
    expect(hasProductionAdUnits(units)).toBe(true);
  });

  it('defaults Android live units to AdMob dashboard ids (owner screenshot)', () => {
    const units = resolveAdUnits();
    expect(units.androidAppId).toBe(COZBIL_ANDROID_LIVE_UNITS.androidAppId);
    expect(units.bannerAndroid).toBe(COZBIL_ANDROID_LIVE_UNITS.bannerAndroid);
    expect(units.interstitialAndroid).toBe(
      COZBIL_ANDROID_LIVE_UNITS.interstitialAndroid,
    );
    expect(units.rewardedAndroid).toBe(COZBIL_ANDROID_LIVE_UNITS.rewardedAndroid);
    expect(units.androidAppId).toBe('ca-app-pub-4628962707131944~2989418548');
    expect(units.rewardedAndroid).toBe('ca-app-pub-4628962707131944/7655421864');
  });

  it('forces stub when EXPO_PUBLIC_ADS_STUB=1', () => {
    process.env.EXPO_PUBLIC_ADS_STUB = '1';
    expect(adsStubForced()).toBe(true);
    expect(isDogfoodAdsStub()).toBe(true);
    expect(createAdEngine().mode).toBe('stub');
    expect(isLiveAdsDeliveryReady()).toBe(false);
  });

  it('is not live-ready without stub, units, or native SDK', () => {
    expect(adsStubForced()).toBe(false);
    expect(isLiveAdsDeliveryReady()).toBe(false);
    expect(createAdEngine().mode).toBe('unavailable');
  });

  it('stub engine rewards and shows interstitial for dogfood gates', async () => {
    const eng = createStubAdEngine();
    expect(await eng.showInterstitial()).toBe('shown');
    expect(await eng.showRewarded()).toBe('rewarded');
  });

  it('unavailable engine never fakes rewards', async () => {
    const eng = createUnavailableAdEngine();
    expect(eng.ready).toBe(false);
    expect(await eng.showInterstitial()).toBe('unavailable');
    expect(await eng.showRewarded()).toBe('unavailable');
  });
});
