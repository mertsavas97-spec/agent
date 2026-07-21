/**
 * Google Play subscription purchase verification.
 * Credentials: PLAY_PACKAGE_NAME + GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (JSON string).
 * Without credentials, never elevates — returns credentials_missing.
 */

export type VerifyPlayInput = {
  productId: string;
  purchaseToken: string;
};

export type VerifyPlayResult =
  | { ok: true; expiresAt: string | null; orderId: string | null }
  | { ok: false; reason: 'credentials_missing' | 'invalid' | 'network' | 'misconfigured' };

const ALLOWED = new Set([
  'cozbil_premium_weekly_intro',
  'cozbil_premium_monthly',
  'cozbil_premium_yearly',
]);

export function isAllowedProductId(productId: string): boolean {
  return ALLOWED.has(productId);
}

export function playCredentialsConfigured(): boolean {
  const pkg = process.env.PLAY_PACKAGE_NAME?.trim();
  const json = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  return Boolean(pkg && json && json.length > 20);
}

/**
 * Verifies a subscription purchase token.
 * Real Android Publisher API call when credentials are present.
 * Until credentials exist, returns credentials_missing (no elevate).
 */
export async function verifyPlayPurchase(input: VerifyPlayInput): Promise<VerifyPlayResult> {
  if (!input.purchaseToken || input.purchaseToken.length < 8) {
    return { ok: false, reason: 'invalid' };
  }
  if (!isAllowedProductId(input.productId)) {
    return { ok: false, reason: 'invalid' };
  }
  if (!playCredentialsConfigured()) {
    return { ok: false, reason: 'credentials_missing' };
  }

  try {
    // Lazy require so unit tests without googleapis still load the module graph.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { google } = require('googleapis') as typeof import('googleapis');
    const packageName = process.env.PLAY_PACKAGE_NAME!.trim();
    const credentials = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON!);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const androidpublisher = google.androidpublisher({ version: 'v3', auth });

    const res = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId: input.productId,
      token: input.purchaseToken,
    });

    const data = res.data;
    const expiryMs = data.expiryTimeMillis ? Number(data.expiryTimeMillis) : NaN;
    const expired = Number.isFinite(expiryMs) && expiryMs < Date.now();
    // paymentState: 0 pending, 1 received, 2 free trial, 3 pending deferred
    if (expired || data.paymentState === 0) {
      return { ok: false, reason: 'invalid' };
    }

    return {
      ok: true,
      expiresAt: Number.isFinite(expiryMs) ? new Date(expiryMs).toISOString() : null,
      orderId: data.orderId ?? null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Cannot find module') || msg.includes('googleapis')) {
      return { ok: false, reason: 'misconfigured' };
    }
    return { ok: false, reason: 'network' };
  }
}
