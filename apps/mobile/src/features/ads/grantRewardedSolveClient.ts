import { httpsCallable } from 'firebase/functions';

import { ensureSignedIn } from '@/src/lib/auth';
import { getFirebase } from '@/src/lib/firebase';

export type GrantRewardedSolveClientResult = {
  ok: boolean;
  granted: boolean;
  reason?: string;
  remainingToday?: number;
  rewardedBonusToday?: number;
};

export async function callGrantRewardedSolve(): Promise<GrantRewardedSolveClientResult> {
  await ensureSignedIn();
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'grantRewardedSolve');
  try {
    const result = await callable({});
    const data = result.data as {
      granted?: boolean;
      reason?: string;
      remainingToday?: number;
      rewardedBonusToday?: number;
    };
    return {
      ok: true,
      granted: Boolean(data?.granted),
      reason: data?.reason,
      remainingToday: data?.remainingToday,
      rewardedBonusToday: data?.rewardedBonusToday,
    };
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : 'unknown';
    return {
      ok: false,
      granted: false,
      reason: code.replace(/^functions\//, '') || 'unknown',
    };
  }
}
