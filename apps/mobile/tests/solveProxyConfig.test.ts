import {
  hostFromPackagerUri,
  metroDevHost,
  resolveSolveProxyBaseUrl,
  resolveSolveProxyToken,
  SOLVE_PROXY_DOGFOOD_TOKEN,
} from '@/src/features/solve/solveProxyConfig';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { hostUri: '192.168.1.42:8081', extra: {} },
    expoGoConfig: null,
    linkingUri: 'exp://192.168.1.42:8081',
    manifest: null,
  },
}));

jest.mock('@/src/config/solveProxy.dev.local', () => ({
  solveProxyDevLocal: { url: '', token: '' },
}));

describe('solveProxyConfig', () => {
  const originalUrl = process.env.EXPO_PUBLIC_SOLVE_PROXY_URL;
  const originalToken = process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_SOLVE_PROXY_URL;
    else process.env.EXPO_PUBLIC_SOLVE_PROXY_URL = originalUrl;
    if (originalToken === undefined) delete process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN;
    else process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN = originalToken;
  });

  it('parses packager host:port', () => {
    expect(hostFromPackagerUri('10.0.0.5:8081')).toBe('10.0.0.5');
    expect(hostFromPackagerUri('http://10.0.0.5:8081')).toBe('10.0.0.5');
    expect(hostFromPackagerUri('[::1]:8081')).toBe('::1');
  });

  it('reads Metro host from Constants.expoConfig.hostUri', () => {
    expect(metroDevHost()).toBe('192.168.1.42');
  });

  it('falls back to http://metro-host:8787 when env/file empty', () => {
    delete process.env.EXPO_PUBLIC_SOLVE_PROXY_URL;
    delete process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN;
    expect(resolveSolveProxyBaseUrl()).toBe('http://192.168.1.42:8787');
    expect(resolveSolveProxyToken()).toBe(SOLVE_PROXY_DOGFOOD_TOKEN);
  });

  it('prefers EXPO_PUBLIC URL over Metro host', () => {
    process.env.EXPO_PUBLIC_SOLVE_PROXY_URL = 'http://10.9.9.9:8787';
    process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN = 'custom';
    expect(resolveSolveProxyBaseUrl()).toBe('http://10.9.9.9:8787');
    expect(resolveSolveProxyToken()).toBe('custom');
  });
});
