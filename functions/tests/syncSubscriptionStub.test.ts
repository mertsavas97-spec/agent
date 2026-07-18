import { syncSubscriptionStub } from '../src/subscription/syncSubscriptionStub';

describe('syncSubscriptionStub', () => {
  it('does not elevate entitlement without sandbox or verified token', () => {
    expect(syncSubscriptionStub({ uid: 'u1' })).toEqual({
      subscriptionStatus: 'free',
      productId: null,
      synced: false,
    });
  });

  it('activates premium in sandbox dogfood mode', () => {
    expect(syncSubscriptionStub({ uid: 'u1', sandboxActive: true })).toEqual({
      subscriptionStatus: 'active',
      productId: 'cozbil_premium_yearly',
      synced: true,
    });
  });
});
