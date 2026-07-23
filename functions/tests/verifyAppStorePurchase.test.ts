import {
  appStoreCredentialsConfigured,
  verifyAppStorePurchase,
} from '../src/subscription/verifyAppStorePurchase';
import { syncSubscriptionDecision } from '../src/subscription/syncSubscription';

describe('verifyAppStorePurchase stub', () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of [
      'APPLE_BUNDLE_ID',
      'APPLE_ISSUER_ID',
      'APPLE_KEY_ID',
      'APPLE_PRIVATE_KEY',
    ]) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('returns credentials_missing without Apple env', async () => {
    expect(appStoreCredentialsConfigured()).toBe(false);
    await expect(
      verifyAppStorePurchase({
        productId: 'cozbil_premium_yearly',
        transactionId: 'txn-123456',
      }),
    ).resolves.toEqual({ ok: false, reason: 'credentials_missing' });
  });

  it('returns not_implemented when credentials exist but live client is absent', async () => {
    process.env.APPLE_BUNDLE_ID = 'com.cozbil.app';
    process.env.APPLE_ISSUER_ID = 'issuer-uuid';
    process.env.APPLE_KEY_ID = 'KEY123';
    process.env.APPLE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\nMIIBfakekeyfortestsonlyxxxxxxxxxxxxxxxx\n-----END PRIVATE KEY-----';
    expect(appStoreCredentialsConfigured()).toBe(true);
    await expect(
      verifyAppStorePurchase({
        productId: 'cozbil_premium_yearly',
        transactionId: 'txn-123456',
      }),
    ).resolves.toEqual({ ok: false, reason: 'not_implemented' });
  });

  it('routes ios platform through App Store stub in sync decision', async () => {
    const res = await syncSubscriptionDecision({
      uid: 'u1',
      productId: 'cozbil_premium_yearly',
      purchaseToken: 'txn-abcdef',
      platform: 'ios',
    });
    expect(res.synced).toBe(false);
    expect(res.reason).toBe('credentials_missing');
  });
});
