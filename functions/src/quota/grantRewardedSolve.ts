/**
 * Grant +1 free solve after a completed rewarded ad (Istanbul day cap).
 */

import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import {
  FREE_DAILY_LIMIT,
  istanbulDate,
  remainingQuota,
  type QuotaState,
} from './dailyQuota';

/** Keep aligned with mobile ADS_LIMITS.rewardedExtraMaxPerIstanbulDay */
export const REWARDED_EXTRA_MAX_PER_DAY = 2;

export type GrantRewardedResult = {
  granted: boolean;
  reason: 'ok' | 'already_max' | 'premium';
  remainingToday: number;
  rewardedBonusToday: number;
};

export function rewardedBonusForDay(
  state: Pick<QuotaState, 'rewardedBonusCount' | 'rewardedBonusDate'>,
  today: string,
): number {
  return state.rewardedBonusDate === today ? Number(state.rewardedBonusCount ?? 0) : 0;
}

/** Pure decision + next state (unit-testable). */
export function decideRewardedGrant(
  state: QuotaState,
  today = istanbulDate(),
  maxPerDay = REWARDED_EXTRA_MAX_PER_DAY,
): { next: QuotaState; result: GrantRewardedResult } {
  if (state.subscriptionStatus === 'active' || state.subscriptionStatus === 'grace') {
    return {
      next: state,
      result: {
        granted: false,
        reason: 'premium',
        remainingToday: remainingQuota(state, today),
        rewardedBonusToday: rewardedBonusForDay(state, today),
      },
    };
  }

  const currentBonus = rewardedBonusForDay(state, today);
  if (currentBonus >= maxPerDay) {
    return {
      next: state,
      result: {
        granted: false,
        reason: 'already_max',
        remainingToday: remainingQuota(state, today),
        rewardedBonusToday: currentBonus,
      },
    };
  }

  const nextBonus = currentBonus + 1;
  const next: QuotaState = {
    ...state,
    rewardedBonusCount: nextBonus,
    rewardedBonusDate: today,
  };
  return {
    next,
    result: {
      granted: true,
      reason: 'ok',
      remainingToday: remainingQuota(next, today),
      rewardedBonusToday: nextBonus,
    },
  };
}

export async function grantRewardedSolveForUser(uid: string): Promise<GrantRewardedResult> {
  const today = istanbulDate();
  const ref = getFirestore().collection('users').doc(uid);

  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() ?? {};
    const state: QuotaState = {
      dailySolveCount: Number(data.dailySolveCount ?? 0),
      dailySolveDate: (data.dailySolveDate as string | null) ?? null,
      subscriptionStatus:
        (data.subscriptionStatus as QuotaState['subscriptionStatus']) ?? 'free',
      rewardedBonusCount: Number(data.rewardedBonusCount ?? 0),
      rewardedBonusDate: (data.rewardedBonusDate as string | null) ?? null,
    };

    const { next, result } = decideRewardedGrant(state, today);
    if (!result.granted) {
      return result;
    }

    tx.set(
      ref,
      {
        rewardedBonusCount: next.rewardedBonusCount,
        rewardedBonusDate: next.rewardedBonusDate,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return result;
  });
}

export { FREE_DAILY_LIMIT };
