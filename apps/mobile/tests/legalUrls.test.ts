import {
  hasPublicPrivacyUrl,
  hasPublicTermsUrl,
  privacyPolicyUrl,
  supportEmail,
  termsUrl,
} from '@/src/features/legal/legalUrls';

describe('legalUrls', () => {
  const prevUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
  const prevTerms = process.env.EXPO_PUBLIC_TERMS_URL;
  const prevMail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
    else process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = prevUrl;
    if (prevTerms === undefined) delete process.env.EXPO_PUBLIC_TERMS_URL;
    else process.env.EXPO_PUBLIC_TERMS_URL = prevTerms;
    if (prevMail === undefined) delete process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
    else process.env.EXPO_PUBLIC_SUPPORT_EMAIL = prevMail;
  });

  it('rejects non-https privacy urls', () => {
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = 'http://insecure.example/privacy';
    expect(privacyPolicyUrl()).toBeNull();
    expect(hasPublicPrivacyUrl()).toBe(false);
  });

  it('accepts https privacy url', () => {
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = 'https://cozbil.app/privacy';
    expect(privacyPolicyUrl()).toBe('https://cozbil.app/privacy');
    expect(hasPublicPrivacyUrl()).toBe(true);
  });

  it('rejects non-https terms urls', () => {
    process.env.EXPO_PUBLIC_TERMS_URL = 'http://insecure.example/terms';
    expect(termsUrl()).toBeNull();
    expect(hasPublicTermsUrl()).toBe(false);
  });

  it('accepts https terms url', () => {
    process.env.EXPO_PUBLIC_TERMS_URL = 'https://cozbil.app/terms';
    expect(termsUrl()).toBe('https://cozbil.app/terms');
    expect(hasPublicTermsUrl()).toBe(true);
  });

  it('defaults support email', () => {
    delete process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
    expect(supportEmail()).toBe('destek@cozbil.app');
  });
});
