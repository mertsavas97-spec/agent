/**
 * Dynamic Expo config — strips expo-dev-client from production EAS builds.
 * Base metadata lives in app.json; this file is the Expo entry when present.
 */
const appJson = require('./app.json');

/** @param {{ config?: { expo?: Record<string, unknown> } }} ctx */
module.exports = () => {
  const expo = structuredClone(appJson.expo);
  const profile = process.env.EAS_BUILD_PROFILE ?? '';

  if (profile === 'production') {
    expo.plugins = (expo.plugins ?? []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name !== 'expo-dev-client';
    });
  }

  return { expo };
};
