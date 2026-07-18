const FREE_DAILY_LIMIT = 5;

export type QuotaState = {
  dailySolveCount: number;
  dailySolveDate: string | null;
  subscriptionStatus: 'free' | 'active' | 'grace' | 'expired';
};

export function istanbulDate(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
}

export function remainingQuota(state: QuotaState, today = istanbulDate()): number {
  if (state.subscriptionStatus === 'active' || state.subscriptionStatus === 'grace') {
    return Number.MAX_SAFE_INTEGER;
  }
  const count = state.dailySolveDate === today ? state.dailySolveCount : 0;
  return Math.max(0, FREE_DAILY_LIMIT - count);
}

export function assertHasQuota(state: QuotaState, today = istanbulDate()): void {
  if (remainingQuota(state, today) <= 0) {
    const err = new Error('QUOTA_EXCEEDED');
    err.name = 'QuotaExceededError';
    throw err;
  }
}

export { FREE_DAILY_LIMIT };
