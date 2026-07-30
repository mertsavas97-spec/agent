import eas from '../eas.json';

describe('EAS production profile', () => {
  const production = eas.build.production;

  it('builds an Android app bundle for store distribution', () => {
    expect(production.android.buildType).toBe('app-bundle');
    expect(production.distribution).toBe('store');
  });

  it('does not wire dogfood solve proxy or premium sandbox', () => {
    const env = production.env ?? {};
    expect(env).not.toHaveProperty('EXPO_PUBLIC_SOLVE_PROXY_URL');
    expect(env).not.toHaveProperty('EXPO_PUBLIC_SOLVE_PROXY_TOKEN');
    expect(env.EXPO_PUBLIC_PREMIUM_SANDBOX).toBe('0');
    expect(env.EXPO_PUBLIC_USE_EMULATORS).toBe('0');
    expect(env.EXPO_PUBLIC_ADS_STUB).toBe('0');
  });

  it('wires live iOS AdMob unit ids (banner / interstitial / rewarded)', () => {
    expect(production.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS).toBe('0');
    expect(production.env.EXPO_PUBLIC_ADMOB_BANNER_IOS).toBe(
      'ca-app-pub-4628962707131944/1521648962',
    );
    expect(production.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS).toBe(
      'ca-app-pub-4628962707131944/3447425993',
    );
    expect(production.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS).toBe(
      'ca-app-pub-4628962707131944/8645460517',
    );
  });

  it('points privacy and terms URLs at Firebase Hosting paths', () => {
    expect(production.env.EXPO_PUBLIC_PRIVACY_POLICY_URL).toMatch(
      /^https:\/\/cozbil-dev-f9583\.web\.app\/privacy$/,
    );
    expect(production.env.EXPO_PUBLIC_TERMS_URL).toMatch(
      /^https:\/\/cozbil-dev-f9583\.web\.app\/terms$/,
    );
  });

  it('keeps iOS phone-first (no iPad tablet target)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appJson = require('../app.json') as {
      expo: {
        ios?: {
          supportsTablet?: boolean;
          infoPlist?: { ITSAppUsesNonExemptEncryption?: boolean };
          entitlements?: { 'aps-environment'?: string };
        };
      };
    };
    expect(appJson.expo.ios?.supportsTablet).toBe(false);
    expect(appJson.expo.ios?.infoPlist?.ITSAppUsesNonExemptEncryption).toBe(false);
    // Static entitlements so EAS syncs Push capability (modifier-only is invisible to sync).
    expect(appJson.expo.ios?.entitlements?.['aps-environment']).toBe('production');
  });

  it('sets Apple Team ID for EAS iOS submit', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const eas = require('../eas.json') as {
      submit: { production: { ios: { appleTeamId?: string; ascAppId?: string } } };
    };
    expect(eas.submit.production.ios.appleTeamId).toBe('J46LLRJA44');
    expect(eas.submit.production.ios.ascAppId).toBe('6794124806');
  });

  it('blocks Play-restricted photo/video permissions (Photo Picker path)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appJson = require('../app.json') as {
      expo: {
        android?: {
          permissions?: string[];
          blockedPermissions?: string[];
        };
      };
    };
    const perms = appJson.expo.android?.permissions ?? [];
    const blocked = appJson.expo.android?.blockedPermissions ?? [];
    expect(perms).not.toContain('android.permission.READ_MEDIA_IMAGES');
    expect(perms).not.toContain('android.permission.READ_MEDIA_VIDEO');
    expect(perms).not.toContain('android.permission.READ_EXTERNAL_STORAGE');
    expect(perms).toContain('android.permission.CAMERA');
    expect(blocked).toEqual(
      expect.arrayContaining([
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      ]),
    );
  });

  it('strips expo-dev-client when EAS_BUILD_PROFILE=production and Firebase keys set', () => {
    const prev = process.env.EAS_BUILD_PROFILE;
    const prevKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    const prevApp = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
    process.env.EAS_BUILD_PROFILE = 'production';
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:1:web:test';
    try {
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appConfigFactory = require('../app.config.js') as () => {
        expo: { plugins?: Array<string | [string, unknown]> };
      };
      const { expo } = appConfigFactory();
      const plugins = expo.plugins ?? [];
      const names = plugins.map((p) => (Array.isArray(p) ? p[0] : p));
      expect(names).not.toContain('expo-dev-client');
      expect(names).toContain('expo-image-picker');
      expect(names).toContain('react-native-google-mobile-ads');
    } finally {
      if (prev === undefined) delete process.env.EAS_BUILD_PROFILE;
      else process.env.EAS_BUILD_PROFILE = prev;
      if (prevKey === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      else process.env.EXPO_PUBLIC_FIREBASE_API_KEY = prevKey;
      if (prevApp === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
      else process.env.EXPO_PUBLIC_FIREBASE_APP_ID = prevApp;
    }
  });

  it('fail-fast when production build lacks Firebase public keys', () => {
    const prev = process.env.EAS_BUILD_PROFILE;
    const prevKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    const prevApp = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
    process.env.EAS_BUILD_PROFILE = 'production';
    delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    delete process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
    try {
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appConfigFactory = require('../app.config.js') as () => unknown;
      expect(() => appConfigFactory()).toThrow(/Missing Firebase public env/);
    } finally {
      if (prev === undefined) delete process.env.EAS_BUILD_PROFILE;
      else process.env.EAS_BUILD_PROFILE = prev;
      if (prevKey === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      else process.env.EXPO_PUBLIC_FIREBASE_API_KEY = prevKey;
      if (prevApp === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
      else process.env.EXPO_PUBLIC_FIREBASE_APP_ID = prevApp;
    }
  });

  it('fail-fast when production has live iOS units but AdMob App ID missing', () => {
    const prev = process.env.EAS_BUILD_PROFILE;
    const prevKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    const prevApp = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
    const prevStub = process.env.EXPO_PUBLIC_ADS_STUB;
    const prevTest = process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS;
    const prevAdmob = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
    const prevBanner = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS;
    const prevInt = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS;
    const prevRew = process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS;
    process.env.EAS_BUILD_PROFILE = 'production';
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:1:web:test';
    process.env.EXPO_PUBLIC_ADS_STUB = '0';
    process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS = '0';
    delete process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
    process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS = 'ca-app-pub-4628962707131944/1521648962';
    process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS =
      'ca-app-pub-4628962707131944/3447425993';
    process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS = 'ca-app-pub-4628962707131944/8645460517';
    try {
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appConfigFactory = require('../app.config.js') as () => unknown;
      expect(() => appConfigFactory()).toThrow(/ADMOB_IOS_APP_ID/);
    } finally {
      if (prev === undefined) delete process.env.EAS_BUILD_PROFILE;
      else process.env.EAS_BUILD_PROFILE = prev;
      if (prevKey === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      else process.env.EXPO_PUBLIC_FIREBASE_API_KEY = prevKey;
      if (prevApp === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
      else process.env.EXPO_PUBLIC_FIREBASE_APP_ID = prevApp;
      if (prevStub === undefined) delete process.env.EXPO_PUBLIC_ADS_STUB;
      else process.env.EXPO_PUBLIC_ADS_STUB = prevStub;
      if (prevTest === undefined) delete process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS;
      else process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS = prevTest;
      if (prevAdmob === undefined) delete process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
      else process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID = prevAdmob;
      if (prevBanner === undefined) delete process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS;
      else process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS = prevBanner;
      if (prevInt === undefined) delete process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS;
      else process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS = prevInt;
      if (prevRew === undefined) delete process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS;
      else process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS = prevRew;
    }
  });

  it('accepts production when live iOS units + real AdMob App ID are set', () => {
    const prev = process.env.EAS_BUILD_PROFILE;
    const prevKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    const prevApp = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
    const prevStub = process.env.EXPO_PUBLIC_ADS_STUB;
    const prevTest = process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS;
    const prevAdmob = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
    const prevBanner = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS;
    const prevInt = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS;
    const prevRew = process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS;
    process.env.EAS_BUILD_PROFILE = 'production';
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:1:web:test';
    process.env.EXPO_PUBLIC_ADS_STUB = '0';
    process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS = '0';
    process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID =
      'ca-app-pub-4628962707131944~1234567890';
    process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS = 'ca-app-pub-4628962707131944/1521648962';
    process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS =
      'ca-app-pub-4628962707131944/3447425993';
    process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS = 'ca-app-pub-4628962707131944/8645460517';
    try {
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appConfigFactory = require('../app.config.js') as () => {
        expo: { plugins?: Array<string | [string, unknown]> };
      };
      const { expo } = appConfigFactory();
      const admob = (expo.plugins ?? []).find(
        (p) => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads',
      ) as [string, { iosAppId: string }] | undefined;
      expect(admob?.[1].iosAppId).toBe('ca-app-pub-4628962707131944~1234567890');
    } finally {
      if (prev === undefined) delete process.env.EAS_BUILD_PROFILE;
      else process.env.EAS_BUILD_PROFILE = prev;
      if (prevKey === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      else process.env.EXPO_PUBLIC_FIREBASE_API_KEY = prevKey;
      if (prevApp === undefined) delete process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
      else process.env.EXPO_PUBLIC_FIREBASE_APP_ID = prevApp;
      if (prevStub === undefined) delete process.env.EXPO_PUBLIC_ADS_STUB;
      else process.env.EXPO_PUBLIC_ADS_STUB = prevStub;
      if (prevTest === undefined) delete process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS;
      else process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS = prevTest;
      if (prevAdmob === undefined) delete process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
      else process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID = prevAdmob;
      if (prevBanner === undefined) delete process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS;
      else process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS = prevBanner;
      if (prevInt === undefined) delete process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS;
      else process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS = prevInt;
      if (prevRew === undefined) delete process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS;
      else process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS = prevRew;
    }
  });
});
