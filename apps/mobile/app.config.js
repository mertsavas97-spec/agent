/**
 * Dynamic Expo config — strips expo-dev-client from production EAS builds.
 * Injects AdMob config plugin with env app ids (Google test ids as safe fallback).
 * Loads apps/mobile/.env + .env.local so EXPO_PUBLIC_* (incl. solve proxy) reach
 * both Metro inlining and Constants.expoConfig.extra.
 */
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

/** Google sample app ids — safe for dogfood / until owner sets real ids. */
const GOOGLE_TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const GOOGLE_TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';
const GOOGLE_TEST_PUBLISHER = '3940256099942544';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Do not override already-exported shell env (CI / phone-dev-build).
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function loadLocalEnv() {
  const root = __dirname;
  // Later files win for empty earlier values — .env.local overrides .env.
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, '.env.local'));
}

loadLocalEnv();

function missingFirebasePublicKeys() {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim();
  const missing = [];
  if (!apiKey) missing.push('EXPO_PUBLIC_FIREBASE_API_KEY');
  if (!appId) missing.push('EXPO_PUBLIC_FIREBASE_APP_ID');
  return missing;
}

function hasLiveIosAdUnits() {
  return Boolean(
    process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS?.trim() &&
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS?.trim() &&
      process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS?.trim(),
  );
}

function hasLiveAndroidAdUnits() {
  return Boolean(
    process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID?.trim() &&
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID?.trim() &&
      process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID?.trim(),
  );
}

/** Real unit ids must pair with real AdMob App ID (~), not Google sample. */
function missingProductionAdMobAppId() {
  if (process.env.EXPO_PUBLIC_ADS_STUB === '1') return null;
  if (process.env.EXPO_PUBLIC_ADS_USE_TEST_UNITS === '1') return null;

  if (hasLiveIosAdUnits()) {
    const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID?.trim() ?? '';
    if (!iosAppId || iosAppId.includes(GOOGLE_TEST_PUBLISHER)) {
      return 'EXPO_PUBLIC_ADMOB_IOS_APP_ID';
    }
    if (!iosAppId.includes('~')) {
      return 'EXPO_PUBLIC_ADMOB_IOS_APP_ID (must be App ID with ~, not a unit / id)';
    }
  }

  if (hasLiveAndroidAdUnits()) {
    const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim() ?? '';
    if (!androidAppId || androidAppId.includes(GOOGLE_TEST_PUBLISHER)) {
      return 'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID';
    }
    if (!androidAppId.includes('~')) {
      return 'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID (must be App ID with ~, not a unit / id)';
    }
  }

  return null;
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
  // Re-load in case Expo evaluates config after cwd env changes.
  loadLocalEnv();

  const expo = structuredClone(appJson.expo);
  const profile = process.env.EAS_BUILD_PROFILE ?? '';

  expo.plugins = withAdMobPlugin(expo.plugins ?? []);

  const extra = { ...(expo.extra && typeof expo.extra === 'object' ? expo.extra : {}) };
  extra.solveProxyUrl = process.env.EXPO_PUBLIC_SOLVE_PROXY_URL?.trim() || '';
  extra.solveProxyToken = process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN?.trim() || '';
  expo.extra = extra;

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

    const admobAppId = missingProductionAdMobAppId();
    if (admobAppId) {
      throw new Error(
        `[EAS production] Live AdMob units are set but ${admobAppId} is missing/test. ` +
          'AdMob → Apps → ÇözBil → App settings → copy App ID (ca-app-pub-…~…). ' +
          'See docs/store/admob-ios-units.md.',
      );
    }

    // Never ship dogfood proxy endpoints in production binaries.
    expo.extra.solveProxyUrl = '';
    expo.extra.solveProxyToken = '';
  }

  return { expo };
};
