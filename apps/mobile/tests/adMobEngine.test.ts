import { __resetAdMobInitForTests, tryCreateAdMobEngine } from '@/src/features/ads/adMobEngine';
import { GOOGLE_TEST_UNITS } from '@/src/features/ads/adUnits';

const mockInitialize = jest.fn(async () => undefined);
const mockSetRequestConfiguration = jest.fn(async () => undefined);
const mockShow = jest.fn(async () => undefined);
const mockLoad = jest.fn();

function mockCreateFakeFullscreenAd() {
  const listeners = new Map<string, Array<(p?: unknown) => void>>();
  return {
    addAdEventListener(event: string, cb: (p?: unknown) => void) {
      const list = listeners.get(event) ?? [];
      list.push(cb);
      listeners.set(event, list);
      return () => {
        listeners.set(
          event,
          (listeners.get(event) ?? []).filter((x) => x !== cb),
        );
      };
    },
    load() {
      mockLoad();
      queueMicrotask(() => {
        for (const cb of listeners.get('loaded') ?? []) cb();
        for (const cb of listeners.get('earned') ?? []) cb({ amount: 1 });
        for (const cb of listeners.get('closed') ?? []) cb();
      });
    },
    show: mockShow,
  };
}

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({
    setRequestConfiguration: (...args: unknown[]) =>
      mockSetRequestConfiguration(...args),
    initialize: (...args: unknown[]) => mockInitialize(...args),
  }),
  MaxAdContentRating: { G: 'G', PG: 'PG', T: 'T', MA: 'MA' },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned' },
  InterstitialAd: {
    createForAdRequest: () => mockCreateFakeFullscreenAd(),
  },
  RewardedAd: {
    createForAdRequest: () => mockCreateFakeFullscreenAd(),
  },
}));

describe('tryCreateAdMobEngine', () => {
  beforeEach(() => {
    __resetAdMobInitForTests();
    mockInitialize.mockClear();
    mockSetRequestConfiguration.mockClear();
    mockShow.mockClear();
    mockLoad.mockClear();
  });

  it('returns an admob engine that can show interstitial and rewarded', async () => {
    const engine = tryCreateAdMobEngine(GOOGLE_TEST_UNITS);
    expect(engine?.mode).toBe('admob');
    await expect(engine!.showInterstitial()).resolves.toBe('shown');
    await expect(engine!.showRewarded()).resolves.toBe('rewarded');
    expect(mockInitialize).toHaveBeenCalled();
    expect(mockSetRequestConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({
        tagForUnderAgeOfConsent: true,
        maxAdContentRating: 'PG',
      }),
    );
  });
});
