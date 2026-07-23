import { billingFailureMessage } from '@/src/features/paywall/billing';

describe('billingFailureMessage', () => {
  it('explains credentials_missing without promising Premium', () => {
    const msg = billingFailureMessage('credentials_missing');
    expect(msg).toMatch(/doğrulaması|yapılandırılmamış/i);
    expect(msg).not.toMatch(/aktif|premium açıldı/i);
  });

  it('maps failed-precondition like credentials_missing', () => {
    expect(billingFailureMessage('failed-precondition')).toEqual(
      billingFailureMessage('credentials_missing'),
    );
  });

  it('covers restore-none and cancel paths', () => {
    expect(billingFailureMessage('none')).toMatch(/bulunamadı/i);
    expect(billingFailureMessage('user_cancelled')).toMatch(/iptal/i);
  });
});
