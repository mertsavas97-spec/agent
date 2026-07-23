import {
  appStoreCredentialsConfigured,
  createAppStoreServerToken,
  decodeJwsPayload,
  resolveAppleTransactionId,
  verifyAppStorePurchase,
} from '../src/subscription/verifyAppStorePurchase';
import { syncSubscriptionDecision } from '../src/subscription/syncSubscription';

function fakeJws(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('verifyAppStorePurchase', () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of [
      'APPLE_BUNDLE_ID',
      'APPLE_ISSUER_ID',
      'APPLE_KEY_ID',
      'APPLE_PRIVATE_KEY',
      'APPLE_IAP_ENVIRONMENT',
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

  it('resolves transaction id from StoreKit 2 JWS', () => {
    const jws = fakeJws({ transactionId: '1000000123456789', productId: 'x' });
    expect(resolveAppleTransactionId(jws)).toBe('1000000123456789');
    expect(resolveAppleTransactionId('plain-txn-id')).toBe('plain-txn-id');
  });

  it('decodes JWS payload', () => {
    const jws = fakeJws({ productId: 'cozbil_premium_yearly', bundleId: 'com.cozbil.app' });
    expect(decodeJwsPayload(jws)?.productId).toBe('cozbil_premium_yearly');
  });

  it('verifies active subscription via App Store Server API mock', async () => {
    // Minimal valid-looking EC private key PEM is hard in tests — use a real
    // P-256 key generated once for unit tests only (not a production secret).
    const { generateKeyPairSync } = require('node:crypto') as typeof import('node:crypto');
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

    process.env.APPLE_BUNDLE_ID = 'com.cozbil.app';
    process.env.APPLE_ISSUER_ID = 'issuer-uuid';
    process.env.APPLE_KEY_ID = 'KEY123ABC';
    process.env.APPLE_PRIVATE_KEY = pem;
    process.env.APPLE_IAP_ENVIRONMENT = 'Sandbox';
    expect(appStoreCredentialsConfigured()).toBe(true);

    const token = createAppStoreServerToken(1_700_000_000);
    expect(token.split('.')).toHaveLength(3);

    const signedTransactionInfo = fakeJws({
      productId: 'cozbil_premium_yearly',
      bundleId: 'com.cozbil.app',
      originalTransactionId: 'orig-1',
      expiresDate: Date.now() + 86_400_000,
      type: 'Auto-Renewable Subscription',
    });

    const fetchMock: typeof fetch = async () =>
      new Response(JSON.stringify({ signedTransactionInfo }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    await expect(
      verifyAppStorePurchase(
        {
          productId: 'cozbil_premium_yearly',
          transactionId: '1000000123456789',
        },
        { fetch: fetchMock },
      ),
    ).resolves.toMatchObject({
      ok: true,
      originalTransactionId: 'orig-1',
    });
  });

  it('rejects expired or mismatched product', async () => {
    const { generateKeyPairSync } = require('node:crypto') as typeof import('node:crypto');
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_BUNDLE_ID = 'com.cozbil.app';
    process.env.APPLE_ISSUER_ID = 'issuer-uuid';
    process.env.APPLE_KEY_ID = 'KEY123ABC';
    process.env.APPLE_PRIVATE_KEY = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString();
    process.env.APPLE_IAP_ENVIRONMENT = 'Production';

    const signedTransactionInfo = fakeJws({
      productId: 'cozbil_premium_monthly',
      bundleId: 'com.cozbil.app',
      expiresDate: Date.now() + 86_400_000,
    });

    const fetchMock: typeof fetch = async () =>
      new Response(JSON.stringify({ signedTransactionInfo }), { status: 200 });

    await expect(
      verifyAppStorePurchase(
        {
          productId: 'cozbil_premium_yearly',
          transactionId: '1000000123456789',
        },
        { fetch: fetchMock },
      ),
    ).resolves.toEqual({ ok: false, reason: 'invalid' });
  });

  it('routes ios platform through App Store verify in sync decision', async () => {
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
