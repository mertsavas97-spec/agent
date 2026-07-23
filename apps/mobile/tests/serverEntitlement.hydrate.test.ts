import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearLocalPremium,
  hydrateEntitlement,
  writeEntitlementCache,
} from '@/src/features/paywall/entitlement';
import { fetchServerEntitlement } from '@/src/features/paywall/serverEntitlement';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/src/features/paywall/serverEntitlement', () => ({
  fetchServerEntitlement: jest.fn(),
}));

describe('hydrateEntitlement server source', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await clearLocalPremium();
    delete process.env.EXPO_PUBLIC_PREMIUM_SANDBOX;
    (fetchServerEntitlement as jest.Mock).mockReset();
  });

  it('prefers server active entitlement over local free', async () => {
    (fetchServerEntitlement as jest.Mock).mockResolvedValue({
      status: 'active',
      source: 'server',
      productId: 'cozbil_premium_yearly',
      planId: 'yearly',
    });
    const snap = await hydrateEntitlement();
    expect(snap.status).toBe('active');
    expect(snap.source).toBe('server');
    expect(snap.planId).toBe('yearly');
  });

  it('clears stale play/server local cache when server says free', async () => {
    await writeEntitlementCache({
      planId: 'yearly',
      productId: 'cozbil_premium_yearly',
      source: 'play',
    });
    (fetchServerEntitlement as jest.Mock).mockResolvedValue({
      status: 'free',
      source: 'server',
      productId: null,
      planId: null,
    });
    const snap = await hydrateEntitlement();
    expect(snap.status).toBe('free');
  });

  it('keeps local activate when server is free', async () => {
    await writeEntitlementCache({
      planId: 'monthly',
      productId: 'cozbil_premium_monthly',
      source: 'local',
    });
    (fetchServerEntitlement as jest.Mock).mockResolvedValue({
      status: 'free',
      source: 'server',
      productId: null,
      planId: null,
    });
    const snap = await hydrateEntitlement();
    expect(snap.status).toBe('active');
    expect(snap.source).toBe('local');
  });
});
