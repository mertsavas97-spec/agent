/**
 * Dynamic Expo config — strips expo-dev-client from production EAS builds.
 * Injects AdMob config plugin with env app ids (Google test ids as safe fallback).
 */
const appJson = require('./app.json');

/** Google sample app ids — safe for dogfood / until owner sets real ids. */
const GOOGLE_TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const GOOGLE_TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

function missingFirebasePublicKeys() {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim();
  const missing = [];
  if (!apiKey) missing.push('EXPO_PUBLIC_FIREBASE_API_KEY');
  if (!appId) missing.push('EXPO_PUBLIC_FIREBASE_APP_ID');
  return missing;
}

function withAdMobPlugin(plugins) {
  const list = Array.isArray(plugins) ? [...plugins] : [];
  const filtered = list.filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== 'react-native-google-mobile-ads';
  });
  filtered.push([
    'react-native-google-mobile-ads',
    {
      androidAppId:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim() ||
        GOOGLE_TEST_ANDROID_APP_ID,
      iosAppId:
        process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID?.trim() || GOOGLE_TEST_IOS_APP_ID,
    },
  ]);
  return filtered;
}

/** @param {{ config?: { expo?: Record<string, unknown> } }} ctx */
module.exports = () => {
  const expo = structuredClone(appJson.expo);
  const profile = process.env.EAS_BUILD_PROFILE ?? '';

  expo.plugins = withAdMobPlugin(expo.plugins ?? []);

  if (profile === 'production') {
    expo.plugins = (expo.plugins ?? []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name !== 'expo-dev-client';
    });

    const missing = missingFirebasePublicKeys();
    if (missing.length > 0) {
      throw new Error(
        `[EAS production] Missing Firebase public env: ${missing.join(', ')}. ` +
          'Set via `eas secret:create` / EAS Environment variables — see docs/setup/EAS_PRODUCTION.md.',
      );
    }
  }

  return { expo };
};
