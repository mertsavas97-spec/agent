/**
 * Public legal URLs for store / in-app deep links.
 * Host under `hosting/public/` then set EXPO_PUBLIC_* URLs in EAS env.
 */

function httpsUrl(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v || !/^https:\/\//i.test(v)) return null;
  return v;
}

export function privacyPolicyUrl(): string | null {
  return httpsUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL);
}

export function termsUrl(): string | null {
  return httpsUrl(process.env.EXPO_PUBLIC_TERMS_URL);
}

export function supportEmail(): string {
  const v = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim();
  return v && v.includes('@') ? v : 'destek@cozbil.app';
}

export function hasPublicPrivacyUrl(): boolean {
  return privacyPolicyUrl() !== null;
}

export function hasPublicTermsUrl(): boolean {
  return termsUrl() !== null;
}
