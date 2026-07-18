import { isQuotaExceededError } from '@/src/features/paywall/isQuotaExceeded';

describe('isQuotaExceededError', () => {
  it('detects Firebase resource-exhausted callable errors', () => {
    expect(isQuotaExceededError({ code: 'functions/resource-exhausted' })).toBe(true);
    expect(isQuotaExceededError({ message: 'Günlük hak bitti' })).toBe(true);
    expect(isQuotaExceededError({ code: 'functions/internal' })).toBe(false);
    expect(isQuotaExceededError(null)).toBe(false);
  });
});
