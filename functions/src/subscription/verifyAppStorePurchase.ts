/**
 * App Store / StoreKit subscription verification (iOS).
 *
 * Env (Functions secrets / params — owner):
 * - APPLE_BUNDLE_ID (e.g. com.cozbil.app)
 * - APPLE_ISSUER_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY  (App Store Connect API key .p8)
 * - APPLE_IAP_ENVIRONMENT optional: Production | Sandbox
 *   (unset → try Production, then Sandbox on 404)
 *
 * Without credentials: credentials_missing (never elevates).
 */

import { createPrivateKey, sign } from 'node:crypto';

import { isAllowedProductId } from './verifyPlayPurchase';

export type VerifyAppStoreInput = {
  productId: string;
  /** StoreKit transaction id, or StoreKit 2 JWS (purchaseToken from expo-iap) */
  transactionId: string;
};

export type VerifyAppStoreResult =
  | { ok: true; expiresAt: string | null; originalTransactionId: string | null }
  | {
      ok: false;
      reason: 'credentials_missing' | 'invalid' | 'network' | 'misconfigured' | 'not_implemented';
    };

type AppleEnv = 'Production' | 'Sandbox';

const PRODUCTION_BASE = 'https://api.storekit.itunes.apple.com';
const SANDBOX_BASE = 'https://api.storekit-sandbox.itunes.apple.com';

export type VerifyAppStoreDeps = {
  fetch?: typeof fetch;
  nowMs?: () => number;
};

export function appStoreCredentialsConfigured(): boolean {
  const bundle = process.env.APPLE_BUNDLE_ID?.trim();
  const issuer = process.env.APPLE_ISSUER_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = normalizePem(process.env.APPLE_PRIVATE_KEY);
  return Boolean(
    bundle &&
      issuer &&
      keyId &&
      privateKey &&
      privateKey.includes('BEGIN') &&
      privateKey.length > 40,
  );
}

function normalizePem(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  return raw.trim().replace(/\\n/g, '\n');
}

function preferredEnvironments(): AppleEnv[] {
  const forced = process.env.APPLE_IAP_ENVIRONMENT?.trim();
  if (forced === 'Sandbox') return ['Sandbox'];
  if (forced === 'Production') return ['Production'];
  return ['Production', 'Sandbox'];
}

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

/** App Store Server API bearer JWT (ES256). */
export function createAppStoreServerToken(nowSec = Math.floor(Date.now() / 1000)): string {
  const keyId = process.env.APPLE_KEY_ID!.trim();
  const issuerId = process.env.APPLE_ISSUER_ID!.trim();
  const bundleId = process.env.APPLE_BUNDLE_ID!.trim();
  const privateKeyPem = normalizePem(process.env.APPLE_PRIVATE_KEY);

  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const payload = {
    iss: issuerId,
    iat: nowSec,
    exp: nowSec + 60 * 5,
    aud: 'appstoreconnect-v1',
    bid: bundleId,
  };
  const signingInput = `${base64urlJson(header)}.${base64urlJson(payload)}`;
  const key = createPrivateKey(privateKeyPem);
  const signature = sign('SHA256', Buffer.from(signingInput, 'utf8'), {
    key,
    dsaEncoding: 'ieee-p1363',
  });
  return `${signingInput}.${Buffer.from(signature).toString('base64url')}`;
}

export function decodeJwsPayload(jws: string): Record<string, unknown> | null {
  const parts = jws.split('.');
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** If client sent a StoreKit 2 JWS, extract transactionId for the Server API. */
export function resolveAppleTransactionId(token: string): string {
  const trimmed = token.trim();
  if (trimmed.split('.').length === 3) {
    const payload = decodeJwsPayload(trimmed);
    const tid = payload?.transactionId ?? payload?.originalTransactionId;
    if (typeof tid === 'string' && tid.trim().length > 0) return tid.trim();
  }
  return trimmed;
}

type TxnInfo = {
  productId?: string;
  bundleId?: string;
  expiresDate?: number;
  originalTransactionId?: string | null;
  revocationDate?: number;
  type?: string;
};

function readTxn(payload: Record<string, unknown>): TxnInfo {
  return {
    productId: typeof payload.productId === 'string' ? payload.productId : undefined,
    bundleId: typeof payload.bundleId === 'string' ? payload.bundleId : undefined,
    expiresDate:
      typeof payload.expiresDate === 'number'
        ? payload.expiresDate
        : typeof payload.expiresDate === 'string'
          ? Number(payload.expiresDate)
          : undefined,
    originalTransactionId:
      typeof payload.originalTransactionId === 'string'
        ? payload.originalTransactionId
        : null,
    revocationDate:
      typeof payload.revocationDate === 'number'
        ? payload.revocationDate
        : typeof payload.revocationDate === 'string'
          ? Number(payload.revocationDate)
          : undefined,
    type: typeof payload.type === 'string' ? payload.type : undefined,
  };
}

async function fetchTransactionInfo(
  transactionId: string,
  env: AppleEnv,
  deps: VerifyAppStoreDeps,
): Promise<
  | { ok: true; signedTransactionInfo: string }
  | { ok: false; reason: 'not_found' | 'network' | 'misconfigured'; status?: number }
> {
  const base = env === 'Sandbox' ? SANDBOX_BASE : PRODUCTION_BASE;
  const url = `${base}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`;
  let token: string;
  try {
    token = createAppStoreServerToken();
  } catch {
    return { ok: false, reason: 'misconfigured' };
  }

  const fetchFn = deps.fetch ?? fetch;
  try {
    const res = await fetchFn(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (res.status === 404) {
      return { ok: false, reason: 'not_found', status: 404 };
    }
    if (!res.ok) {
      return { ok: false, reason: 'network', status: res.status };
    }
    const body = (await res.json()) as { signedTransactionInfo?: string };
    if (!body.signedTransactionInfo || typeof body.signedTransactionInfo !== 'string') {
      return { ok: false, reason: 'misconfigured' };
    }
    return { ok: true, signedTransactionInfo: body.signedTransactionInfo };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/**
 * Verifies an App Store subscription purchase via App Store Server API.
 * Never elevates without a matching active subscription transaction.
 */
export async function verifyAppStorePurchase(
  input: VerifyAppStoreInput,
  deps: VerifyAppStoreDeps = {},
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

  const transactionId = resolveAppleTransactionId(input.transactionId);
  const bundleId = process.env.APPLE_BUNDLE_ID!.trim();
  const now = deps.nowMs ? deps.nowMs() : Date.now();

  let lastFailure: VerifyAppStoreResult = { ok: false, reason: 'network' };

  for (const env of preferredEnvironments()) {
    const fetched = await fetchTransactionInfo(transactionId, env, deps);
    if (!fetched.ok) {
      if (fetched.reason === 'not_found') {
        lastFailure = { ok: false, reason: 'invalid' };
        continue;
      }
      if (fetched.reason === 'misconfigured') {
        return { ok: false, reason: 'misconfigured' };
      }
      lastFailure = { ok: false, reason: 'network' };
      continue;
    }

    const payload = decodeJwsPayload(fetched.signedTransactionInfo);
    if (!payload) {
      return { ok: false, reason: 'invalid' };
    }
    const txn = readTxn(payload);

    if (txn.bundleId && txn.bundleId !== bundleId) {
      return { ok: false, reason: 'invalid' };
    }
    if (!txn.productId || txn.productId !== input.productId) {
      return { ok: false, reason: 'invalid' };
    }
    if (txn.revocationDate && Number.isFinite(txn.revocationDate)) {
      return { ok: false, reason: 'invalid' };
    }
    if (
      typeof txn.expiresDate === 'number' &&
      Number.isFinite(txn.expiresDate) &&
      txn.expiresDate < now
    ) {
      return { ok: false, reason: 'invalid' };
    }

    return {
      ok: true,
      expiresAt:
        typeof txn.expiresDate === 'number' && Number.isFinite(txn.expiresDate)
          ? new Date(txn.expiresDate).toISOString()
          : null,
      originalTransactionId: txn.originalTransactionId ?? null,
    };
  }

  return lastFailure;
}
