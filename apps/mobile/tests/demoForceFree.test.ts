import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  __resetDemoForceFreeForTests,
  hydrateDemoForceFree,
  isDemoForceFree,
  setDemoForceFree,
} from '@/src/features/paywall/demoForceFree';
import {
  activateLocalPremium,
  clearLocalPremium,
  hydrateEntitlement,
  isPremiumActive,
  readLocalEntitlement,
} from '@/src/features/paywall/entitlement';
import { isPremiumAudience } from '@/src/features/ads/premiumGate';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('demo force free (dogfood)', () => {
  beforeEach(async () => {
    __resetDemoForceFreeForTests();
    await AsyncStorage.clear();
    await clearLocalPremium();
    delete process.env.EXPO_PUBLIC_PREMIUM_SANDBOX;
  });

  it('overrides active Premium to free without wiping storage', async () => {
    await activateLocalPremium('yearly');
    expect(isPremiumActive(readLocalEntitlement())).toBe(true);
    expect(isPremiumAudience()).toBe(true);

    await setDemoForceFree(true);
    expect(isDemoForceFree()).toBe(true);
    expect(isPremiumActive()).toBe(false);
    expect(isPremiumAudience()).toBe(false);
    expect((await hydrateEntitlement()).status).toBe('free');

    await setDemoForceFree(false);
    expect(isPremiumActive(await hydrateEntitlement())).toBe(true);
    expect(isPremiumAudience()).toBe(true);
  });

  it('hydrates force-free flag from AsyncStorage', async () => {
    await setDemoForceFree(true);
    __resetDemoForceFreeForTests();
    expect(isDemoForceFree()).toBe(false);
    await hydrateDemoForceFree();
    expect(isDemoForceFree()).toBe(true);
  });

  it('clears force-free when Premium is activated again', async () => {
    await activateLocalPremium('monthly');
    await setDemoForceFree(true);
    expect(isPremiumActive()).toBe(false);

    await activateLocalPremium('yearly');
    expect(isDemoForceFree()).toBe(false);
    expect(isPremiumActive(await hydrateEntitlement())).toBe(true);
  });
});
