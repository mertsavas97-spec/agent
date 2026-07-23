// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'coverage/**',
      // Jest suites use hoist/mocks patterns; lint product code first.
      'tests/**',
      'jest.setup.js',
      'jest.config.js',
      'babel.config.js',
      'metro.config.js',
      'app.config.js',
    ],
  },
  {
    rules: {
      // React Compiler-style rules are noisy for current RN patterns (reanimated, gates).
      // Keep as follow-up tightening; do not block store CI.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/no-unescaped-entities': 'warn',
    },
  },
]);
