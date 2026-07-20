import { buildDefaultUserDoc } from '../src/users/bootstrapUser';

describe('onboarding user fields', () => {
  it('default user has null onboardingCompletedAt', () => {
    const doc = buildDefaultUserDoc({ uid: 'u1', examType: 'kpss' });
    expect(doc.onboardingCompletedAt).toBeNull();
    expect(doc.consentAcceptedAt).toBeNull();
    expect(doc.examType).toBe('kpss');
  });
});
