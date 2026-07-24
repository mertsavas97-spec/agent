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
        };
      };
    };
    expect(appJson.expo.ios?.supportsTablet).toBe(false);
    expect(appJson.expo.ios?.infoPlist?.ITSAppUsesNonExemptEncryption).toBe(false);
  });

  it('sets Apple Team ID for EAS iOS submit', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const eas = require('../eas.json') as {
      submit: { production: { ios: { appleTeamId?: string; ascAppId?: string } } };
    };
    expect(eas.submit.production.ios.appleTeamId).toBe('J46LLRJA44');
    expect(eas.submit.production.ios.ascAppId).toMatch(/REPLACE_|^\d+$/);
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
});
