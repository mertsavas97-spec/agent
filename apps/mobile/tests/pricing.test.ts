import { DEFAULT_PLAN_ID, PRICING, planById } from '@/src/features/paywall/pricing';

describe('Premium pricing policy', () => {
  it('locks founder monthly at 39 TRY with week intro and yearly value plan', () => {
    expect(PRICING.monthly.priceTry).toBe(39);
    expect(PRICING.week.priceTry).toBe(14.9);
    expect(PRICING.yearly.priceTry).toBe(349);
    expect(DEFAULT_PLAN_ID).toBe('yearly');
    expect(planById('monthly').productId).toBe('cozbil_premium_monthly');
    expect(planById('week').productId).toBe('cozbil_premium_weekly_intro');
    expect(planById('yearly').productId).toBe('cozbil_premium_yearly');
  });

  it('yearly effective monthly is under monthly sticker', () => {
    const effective = PRICING.yearly.priceTry / 12;
    expect(effective).toBeLessThan(PRICING.monthly.priceTry);
    expect(effective).toBeCloseTo(29.083, 2);
  });
});
