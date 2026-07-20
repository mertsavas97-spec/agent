import {
  consentLabel,
  formatRemainingQuota,
  remainingFreeSolves,
} from '@/src/features/profile/quotaDisplay';

describe('quotaDisplay', () => {
  it('computes remaining free solves for Istanbul day', () => {
    expect(
      remainingFreeSolves(
        { dailySolveCount: 2, dailySolveDate: '2026-07-18', subscriptionStatus: 'free' },
        '2026-07-18',
      ),
    ).toBe(3);
    expect(
      remainingFreeSolves(
        { dailySolveCount: 5, dailySolveDate: '2026-07-17', subscriptionStatus: 'free' },
        '2026-07-18',
      ),
    ).toBe(5);
    expect(
      formatRemainingQuota(
        remainingFreeSolves({
          dailySolveCount: 0,
          dailySolveDate: null,
          subscriptionStatus: 'active',
        }),
      ),
    ).toMatch(/Premium/);
  });

  it('labels consent for adult vs parental paths', () => {
    expect(
      consentLabel({ consentAcceptedAt: null, parentalConsentAt: null }),
    ).toBe('Onay yok');
    expect(
      consentLabel({
        consentAcceptedAt: true,
        parentalConsentAt: null,
        ageBand: '18plus',
      }),
    ).toMatch(/Aydınlatma/);
    expect(
      consentLabel({
        consentAcceptedAt: true,
        parentalConsentAt: true,
        ageBand: '13to17',
      }),
    ).toMatch(/Veli/);
  });
});
