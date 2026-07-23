import { istanbulDateKey } from '@/src/features/ads/dayKey';

const FREE_DAILY_LIMIT = 5;

export type ProfileQuotaInput = {
  dailySolveCount: number;
  dailySolveDate: string | null;
  subscriptionStatus: string;
  rewardedBonusCount?: number;
  rewardedBonusDate?: string | null;
};

export function dailyLimitForProfile(
  input: ProfileQuotaInput,
  today = istanbulDateKey(),
): number {
  const bonus =
    input.rewardedBonusDate === today ? Number(input.rewardedBonusCount ?? 0) : 0;
  return FREE_DAILY_LIMIT + bonus;
}

export function remainingFreeSolves(input: ProfileQuotaInput, today = istanbulDateKey()): number {
  if (input.subscriptionStatus === 'active' || input.subscriptionStatus === 'grace') {
    return Number.POSITIVE_INFINITY;
  }
  const count = input.dailySolveDate === today ? input.dailySolveCount : 0;
  return Math.max(0, dailyLimitForProfile(input, today) - count);
}

export function formatRemainingQuota(
  remaining: number,
  dailyLimit = FREE_DAILY_LIMIT,
): string {
  if (!Number.isFinite(remaining)) return 'Sınırsız (Premium)';
  return `${remaining} / ${dailyLimit}`;
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
