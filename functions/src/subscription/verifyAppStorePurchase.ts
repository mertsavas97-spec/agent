/**
 * App Store / StoreKit subscription verification (iOS).
 * Stub until App Store Server API credentials are configured.
 *
 * Planned env (owner):
 * - APPLE_BUNDLE_ID (e.g. com.cozbil.app)
 * - APPLE_ISSUER_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY  (App Store Connect API key)
 * Until then: never elevates — returns credentials_missing.
 */

import { isAllowedProductId } from './verifyPlayPurchase';

export type VerifyAppStoreInput = {
  productId: string;
  /** StoreKit transaction / JWS / legacy receipt token from client */
  transactionId: string;
};

export type VerifyAppStoreResult =
  | { ok: true; expiresAt: string | null; originalTransactionId: string | null }
  | {
      ok: false;
      reason: 'credentials_missing' | 'invalid' | 'network' | 'misconfigured' | 'not_implemented';
    };

export function appStoreCredentialsConfigured(): boolean {
  const bundle = process.env.APPLE_BUNDLE_ID?.trim();
  const issuer = process.env.APPLE_ISSUER_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = process.env.APPLE_PRIVATE_KEY?.trim();
  return Boolean(
    bundle &&
      issuer &&
      keyId &&
      privateKey &&
      privateKey.includes('BEGIN') &&
      privateKey.length > 40,
  );
}

/**
 * Verifies an App Store subscription purchase.
 * Full App Store Server API wiring is post-Android-first; this stub refuses
 * elevation without credentials and returns not_implemented when credentials
 * exist but the live client is not shipped yet.
 */
export async function verifyAppStorePurchase(
  input: VerifyAppStoreInput,
): Promise<VerifyAppStoreResult> {
  if (!input.transactionId || input.transactionId.trim().length < 6) {
    return { ok: false, reason: 'invalid' };
  }
  if (!isAllowedProductId(input.productId)) {
    return { ok: false, reason: 'invalid' };
  }
  if (!appStoreCredentialsConfigured()) {
    return { ok: false, reason: 'credentials_missing' };
  }

  // Credentials present but live StoreKit Server API client not wired yet.
  // Prefer honest not_implemented over fake ok — never elevate Premium.
  return { ok: false, reason: 'not_implemented' };
}
