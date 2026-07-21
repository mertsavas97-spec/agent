import {
  activateLocalPremium,
  canUseLocalPremium,
  clearLocalPremium,
  isPremiumActive,
  readLocalEntitlement,
} from '@/src/features/paywall/entitlement';

describe('entitlement local gate', () => {
  beforeEach(async () => {
    await clearLocalPremium();
    delete process.env.EXPO_PUBLIC_PREMIUM_SANDBOX;
  });

  it('allows local activate in __DEV__', async () => {
    expect(canUseLocalPremium()).toBe(true);
    const res = await activateLocalPremium('yearly');
    expect(res.ok).toBe(true);
    expect(res.reason).toBe('local');
    expect(isPremiumActive(readLocalEntitlement())).toBe(true);
  });

  it('sandbox env forces active without billing', async () => {
    process.env.EXPO_PUBLIC_PREMIUM_SANDBOX = '1';
    const res = await activateLocalPremium('monthly');
    expect(res.ok).toBe(true);
    expect(res.reason).toBe('sandbox');
  });
});
