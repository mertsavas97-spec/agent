/**
 * Grant +1 free solve after a completed rewarded ad.
 * No product daily max — abuse rate-limit is on the callable.
 */

import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import {
  FREE_DAILY_LIMIT,
  istanbulDate,
  remainingQuota,
  type QuotaState,
} from './dailyQuota';

export type GrantRewardedResult = {
  granted: boolean;
  reason: 'ok' | 'premium';
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

  const nextBonus = rewardedBonusForDay(state, today) + 1;
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
