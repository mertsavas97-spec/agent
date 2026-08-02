import { isSolveProxyConfigured } from '@/src/features/solve/solveViaProxy';

/**
 * Guarantees the committed stub stays empty so LAN tokens are not shipped
 * from a dirty working tree in CI. Local dogfood overwrites the file.
 */
describe('solveProxy.dev.local stub', () => {
  it('keeps committed stub empty (dogfood script fills locally)', () => {
    // Re-require the module as committed in the repo under test.
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { solveProxyDevLocal } = require('@/src/config/solveProxy.dev.local') as {
      solveProxyDevLocal: { url: string; token: string };
    };
    expect(solveProxyDevLocal.url).toBe('');
    expect(solveProxyDevLocal.token).toBe('');
  });

  it('isSolveProxyConfigured can still use env when stub empty', () => {
    process.env.EXPO_PUBLIC_SOLVE_PROXY_URL = 'https://solve.example';
    process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN = 't';
    expect(isSolveProxyConfigured()).toBe(true);
    delete process.env.EXPO_PUBLIC_SOLVE_PROXY_URL;
    delete process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN;
  });
});

// Keep Constants empty so Metro auto-fallback does not mask the stub/env tests.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: {} },
    expoGoConfig: null,
    linkingUri: null,
    manifest: null,
  },
}));
