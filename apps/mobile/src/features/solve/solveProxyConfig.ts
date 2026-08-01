/**
 * Resolve dogfood solve-proxy URL/token for __DEV__ phone demos.
 *
 * Priority for URL: solveProxy.dev.local.ts → EXPO_PUBLIC_* → Constants.extra
 * → Metro packager host (same LAN IP as the Mac) on port 8787.
 *
 * Token: file/env/extra, else the shared dogfood default used by
 * scripts/phone-demo-proxy-mac.sh (LAN-only, __DEV__ gated).
 */
import Constants from 'expo-constants';

import { solveProxyDevLocal } from '@/src/config/solveProxy.dev.local';

export const SOLVE_PROXY_DEFAULT_PORT = 8787;

/** Must match scripts/phone-demo-proxy-mac.sh default when COZBIL_PROXY_TOKEN unset. */
export const SOLVE_PROXY_DOGFOOD_TOKEN = 'cozbil-phone-demo';

type SolveProxyExtra = {
  solveProxyUrl?: string;
  solveProxyToken?: string;
};

function proxyExtra(): SolveProxyExtra {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== 'object') return {};
  return extra as SolveProxyExtra;
}

/** Extract host from "192.168.1.10:8081" / "[::1]:8081" / "hostname:port". */
export function hostFromPackagerUri(raw: string | null | undefined): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  // Strip path if a full URL leaked in
  const withoutScheme = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const authority = withoutScheme.split('/')[0] ?? '';
  if (!authority) return null;

  if (authority.startsWith('[')) {
    const end = authority.indexOf(']');
    if (end > 1) return authority.slice(1, end);
  }

  const colon = authority.lastIndexOf(':');
  if (colon > 0 && /^\d+$/.test(authority.slice(colon + 1))) {
    return authority.slice(0, colon);
  }
  return authority || null;
}

/**
 * Metro / Expo CLI host the phone is already talking to — same machine as
 * phone-demo-proxy when using LAN USB/Wi‑Fi dogfood.
 */
export function metroDevHost(): string | null {
  const candidates: (string | null | undefined)[] = [
    // SDK 49+: present while Expo CLI serves the bundle
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.linkingUri,
  ];

  // Legacy classic manifest (still populated in some dev-client builds)
  const legacy = Constants.manifest as { debuggerHost?: string; hostUri?: string } | null;
  if (legacy && typeof legacy === 'object') {
    candidates.push(legacy.debuggerHost, legacy.hostUri);
  }

  for (const c of candidates) {
    const host = hostFromPackagerUri(c);
    if (!host) continue;
    // Ignore loopback — phone cannot reach Mac via 127.0.0.1
    if (host === '127.0.0.1' || host === 'localhost' || host === '::1') continue;
    return host;
  }
  return null;
}

export function resolveSolveProxyBaseUrl(): string | null {
  const fromFile = solveProxyDevLocal.url?.trim();
  const fromEnv = process.env.EXPO_PUBLIC_SOLVE_PROXY_URL?.trim();
  const fromExtra = proxyExtra().solveProxyUrl?.trim();
  const fromMetro = (() => {
    const host = metroDevHost();
    return host ? `http://${host}:${SOLVE_PROXY_DEFAULT_PORT}` : '';
  })();
  const raw = fromFile || fromEnv || fromExtra || fromMetro || '';
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

export function resolveSolveProxyToken(): string | null {
  const fromFile = solveProxyDevLocal.token?.trim();
  const fromEnv = process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN?.trim();
  const fromExtra = proxyExtra().solveProxyToken?.trim();
  const raw = fromFile || fromEnv || fromExtra || '';
  if (raw) return raw;
  // Only when a URL can be resolved — never invent a token for production.
  if (resolveSolveProxyBaseUrl()) return SOLVE_PROXY_DOGFOOD_TOKEN;
  return null;
}

export type SolveProxyDiag = {
  dev: boolean;
  urlSource: 'file' | 'env' | 'extra' | 'metro' | 'none';
  tokenSource: 'file' | 'env' | 'extra' | 'dogfood-default' | 'none';
  base: string | null;
  metroHost: string | null;
};

export function diagnoseSolveProxyConfig(): SolveProxyDiag {
  const fromFileUrl = Boolean(solveProxyDevLocal.url?.trim());
  const fromEnvUrl = Boolean(process.env.EXPO_PUBLIC_SOLVE_PROXY_URL?.trim());
  const fromExtraUrl = Boolean(proxyExtra().solveProxyUrl?.trim());
  const metroHost = metroDevHost();
  let urlSource: SolveProxyDiag['urlSource'] = 'none';
  if (fromFileUrl) urlSource = 'file';
  else if (fromEnvUrl) urlSource = 'env';
  else if (fromExtraUrl) urlSource = 'extra';
  else if (metroHost) urlSource = 'metro';

  const fromFileTok = Boolean(solveProxyDevLocal.token?.trim());
  const fromEnvTok = Boolean(process.env.EXPO_PUBLIC_SOLVE_PROXY_TOKEN?.trim());
  const fromExtraTok = Boolean(proxyExtra().solveProxyToken?.trim());
  let tokenSource: SolveProxyDiag['tokenSource'] = 'none';
  if (fromFileTok) tokenSource = 'file';
  else if (fromEnvTok) tokenSource = 'env';
  else if (fromExtraTok) tokenSource = 'extra';
  else if (resolveSolveProxyBaseUrl()) tokenSource = 'dogfood-default';

  return {
    dev: Boolean(__DEV__),
    urlSource,
    tokenSource,
    base: resolveSolveProxyBaseUrl(),
    metroHost,
  };
}
