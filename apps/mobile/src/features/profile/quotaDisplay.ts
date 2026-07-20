import { istanbulDateKey } from '@/src/features/ads/dayKey';

const FREE_DAILY_LIMIT = 5;

export type ProfileQuotaInput = {
  dailySolveCount: number;
  dailySolveDate: string | null;
  subscriptionStatus: string;
};

export function remainingFreeSolves(input: ProfileQuotaInput, today = istanbulDateKey()): number {
  if (input.subscriptionStatus === 'active' || input.subscriptionStatus === 'grace') {
    return Number.POSITIVE_INFINITY;
  }
  const count = input.dailySolveDate === today ? input.dailySolveCount : 0;
  return Math.max(0, FREE_DAILY_LIMIT - count);
}

export function formatRemainingQuota(remaining: number): string {
  if (!Number.isFinite(remaining)) return 'Sınırsız (Premium)';
  return `${remaining} / ${FREE_DAILY_LIMIT}`;
}

export function consentLabel(input: {
  consentAcceptedAt: unknown | null | undefined;
  parentalConsentAt: unknown | null | undefined;
  ageBand?: string | null;
}): string {
  if (!input.consentAcceptedAt) return 'Onay yok';
  if (input.ageBand === '13to17' || input.ageBand === 'under13' || input.parentalConsentAt) {
    return 'Veli / yaşa uygun onay alındı';
  }
  return 'Aydınlatma onayı alındı';
}

export { FREE_DAILY_LIMIT };
