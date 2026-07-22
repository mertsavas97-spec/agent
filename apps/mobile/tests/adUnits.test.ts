import {
  GOOGLE_TEST_UNITS,
  adsStubForced,
  hasProductionAdUnits,
  resolveAdUnits,
} from '@/src/features/ads/adUnits';
import { createAdEngine, createStubAdEngine } from '@/src/features/ads/adEngine';

describe('ad units + engine readiness', () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of [
      'EXPO_PUBLIC_ADS_STUB',
      'EXPO_PUBLIC_ADS_USE_TEST_UNITS',
      'EXPO_PUBLIC_ADMOB_BANNER_ANDROID',
      'EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID',
      'EXPO_PUBLIC_ADMOB_REWARDED_ANDROID',
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

  it('forces stub when EXPO_PUBLIC_ADS_STUB=1', () => {
    process.env.EXPO_PUBLIC_ADS_STUB = '1';
    expect(adsStubForced()).toBe(true);
    expect(createAdEngine().mode).toBe('stub');
  });

  it('stub engine rewards and shows interstitial for dogfood gates', async () => {
    const eng = createStubAdEngine();
    expect(await eng.showInterstitial()).toBe('shown');
    expect(await eng.showRewarded()).toBe('rewarded');
  });
});
