import {
  billingSandboxEnabled,
  syncSubscriptionDecision,
} from '../src/subscription/syncSubscription';
import { isAllowedProductId } from '../src/subscription/verifyPlayPurchase';

describe('syncSubscriptionDecision', () => {
  const prev = process.env.COZBIL_BILLING_SANDBOX;

  afterEach(() => {
    if (prev === undefined) delete process.env.COZBIL_BILLING_SANDBOX;
    else process.env.COZBIL_BILLING_SANDBOX = prev;
  });

  it('never elevates without token', async () => {
    const res = await syncSubscriptionDecision({ uid: 'u1' });
    expect(res).toMatchObject({
      subscriptionStatus: 'free',
      synced: false,
      reason: 'missing_token',
    });
  });

  it('rejects sandbox when server flag off', async () => {
    delete process.env.COZBIL_BILLING_SANDBOX;
    const res = await syncSubscriptionDecision({ uid: 'u1', sandboxActive: true });
    expect(res.reason).toBe('sandbox_disabled');
    expect(res.synced).toBe(false);
  });

  it('activates sandbox when COZBIL_BILLING_SANDBOX=1', async () => {
    process.env.COZBIL_BILLING_SANDBOX = '1';
    expect(billingSandboxEnabled()).toBe(true);
    const res = await syncSubscriptionDecision({
      uid: 'u1',
      sandboxActive: true,
      productId: 'cozbil_premium_monthly',
    });
    expect(res).toMatchObject({
      subscriptionStatus: 'active',
      productId: 'cozbil_premium_monthly',
      synced: true,
      reason: 'sandbox',
    });
  });

  it('elevates when verify ok', async () => {
    const res = await syncSubscriptionDecision(
      {
        uid: 'u1',
        productId: 'cozbil_premium_yearly',
        purchaseToken: 'token-abc-12345',
      },
      async () => ({ ok: true, expiresAt: '2030-01-01T00:00:00.000Z', orderId: 'order1' }),
    );
    expect(res).toMatchObject({
      subscriptionStatus: 'active',
      productId: 'cozbil_premium_yearly',
      synced: true,
      reason: 'ok',
    });
  });

  it('does not elevate when credentials missing', async () => {
    const res = await syncSubscriptionDecision(
      {
        uid: 'u1',
        productId: 'cozbil_premium_yearly',
        purchaseToken: 'token-abc-12345',
      },
      async () => ({ ok: false, reason: 'credentials_missing' }),
    );
    expect(res.synced).toBe(false);
    expect(res.reason).toBe('credentials_missing');
  });

  it('allow-lists product ids', () => {
    expect(isAllowedProductId('cozbil_premium_yearly')).toBe(true);
    expect(isAllowedProductId('evil_sku')).toBe(false);
  });
});
