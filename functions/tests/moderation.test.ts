import {
  evaluateSafeSearch,
  shouldBillQuota,
} from '../src/moderation/safeSearch';

describe('moderation gate', () => {
  it('rejects likely adult content without billing', () => {
    const decision = evaluateSafeSearch({ adult: 'LIKELY', violence: 'VERY_UNLIKELY' });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.billed).toBe(false);
      expect(decision.userMessage.toLowerCase()).toContain('soru');
    }
    expect(shouldBillQuota('rejected_moderation')).toBe(false);
  });

  it('allows clean labels', () => {
    expect(
      evaluateSafeSearch({
        adult: 'VERY_UNLIKELY',
        violence: 'UNLIKELY',
        racy: 'UNLIKELY',
      }).ok,
    ).toBe(true);
  });

  it('bills only solved status', () => {
    expect(shouldBillQuota('solved')).toBe(true);
    expect(shouldBillQuota('unsupported_type')).toBe(false);
    expect(shouldBillQuota('rejected_not_question')).toBe(false);
  });
});
