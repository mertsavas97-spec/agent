import { httpsCallable } from 'firebase/functions';

import { getFirebase } from '@/src/lib/firebase';

export type PurgeAccountClientResult = {
  ok: boolean;
  reason?: string;
};

export async function callPurgeAccount(): Promise<PurgeAccountClientResult> {
  const { functions } = getFirebase();
  const callable = httpsCallable(functions, 'purgeAccount');
  try {
    const result = await callable({});
    const data = result.data as { purged?: boolean; reason?: string };
    if (!data?.purged) {
      return { ok: false, reason: data?.reason ?? 'not_purged' };
    }
    return { ok: true, reason: data.reason ?? 'ok' };
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : 'unknown';
    const message = err instanceof Error ? err.message : String(err);
    if (code === 'functions/failed-precondition') {
      return { ok: false, reason: 'delete_not_requested' };
    }
    return {
      ok: false,
      reason: message || code.replace(/^functions\//, '') || 'unknown',
    };
  }
}
