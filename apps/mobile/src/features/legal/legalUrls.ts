/**
 * Public legal URLs for store / in-app deep links.
 * Host `docs/legal/privacy-tr.html` then set EXPO_PUBLIC_PRIVACY_POLICY_URL.
 */

export function privacyPolicyUrl(): string | null {
  const v = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
  if (!v || !/^https:\/\//i.test(v)) return null;
  return v;
}

export function supportEmail(): string {
  const v = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim();
  return v && v.includes('@') ? v : 'destek@cozbil.app';
}

export function hasPublicPrivacyUrl(): boolean {
  return privacyPolicyUrl() !== null;
}
