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
  });

  it('points privacy URL at Firebase Hosting privacy path', () => {
    expect(production.env.EXPO_PUBLIC_PRIVACY_POLICY_URL).toMatch(
      /^https:\/\/cozbil-dev-f9583\.web\.app\/privacy$/,
    );
  });

  it('strips expo-dev-client when EAS_BUILD_PROFILE=production', () => {
    const prev = process.env.EAS_BUILD_PROFILE;
    process.env.EAS_BUILD_PROFILE = 'production';
    try {
      // Fresh require so factory sees current env
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appConfigFactory = require('../app.config.js') as () => {
        expo: { plugins?: Array<string | [string, unknown]> };
      };
      const { expo } = appConfigFactory();
      const plugins = expo.plugins ?? [];
      const names = plugins.map((p) => (Array.isArray(p) ? p[0] : p));
      expect(names).not.toContain('expo-dev-client');
    } finally {
      if (prev === undefined) delete process.env.EAS_BUILD_PROFILE;
      else process.env.EAS_BUILD_PROFILE = prev;
    }
  });
});
