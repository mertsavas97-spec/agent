import { SAFETY_MESSAGES } from '../safety/messages';

/** Cloud Vision SafeSearch annotation likelihoods. */
export type Likelihood =
  | 'UNKNOWN'
  | 'VERY_UNLIKELY'
  | 'UNLIKELY'
  | 'POSSIBLE'
  | 'LIKELY'
  | 'VERY_LIKELY';

export type SafeSearchLabels = {
  adult?: Likelihood;
  violence?: Likelihood;
  racy?: Likelihood;
  spoof?: Likelihood;
  medical?: Likelihood;
};

const BLOCK_AT: Likelihood[] = ['LIKELY', 'VERY_LIKELY'];

export type ModerationDecision =
  | { ok: true }
  | { ok: false; reason: 'moderation'; userMessage: string; billed: false };

export function evaluateSafeSearch(labels: SafeSearchLabels): ModerationDecision {
  const flagged = (['adult', 'violence', 'racy'] as const).some((key) => {
    const value = labels[key];
    return value !== undefined && BLOCK_AT.includes(value);
  });

  if (flagged) {
    return {
      ok: false,
      reason: 'moderation',
      userMessage: SAFETY_MESSAGES.moderationReject,
      billed: false,
    };
  }
  return { ok: true };
}

/** Whether a solve attempt should consume daily quota. */
export function shouldBillQuota(status: string): boolean {
  return status === 'solved';
}
