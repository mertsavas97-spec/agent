/**
 * Dynamic Expo config — strips expo-dev-client from production EAS builds.
 * Base metadata lives in app.json; this file is the Expo entry when present.
 */
const appJson = require('./app.json');

function missingFirebasePublicKeys() {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim();
  const missing = [];
  if (!apiKey) missing.push('EXPO_PUBLIC_FIREBASE_API_KEY');
  if (!appId) missing.push('EXPO_PUBLIC_FIREBASE_APP_ID');
  return missing;
}

/** @param {{ config?: { expo?: Record<string, unknown> } }} ctx */
module.exports = () => {
  const expo = structuredClone(appJson.expo);
  const profile = process.env.EAS_BUILD_PROFILE ?? '';

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
