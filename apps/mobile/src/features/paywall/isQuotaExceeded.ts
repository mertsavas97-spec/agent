/** Detect Firebase callable daily-quota errors from solveQuestion. */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string; name?: string };
  if (e.code === 'functions/resource-exhausted') return true;
  if (typeof e.message === 'string' && /günlük hak/i.test(e.message)) return true;
  if (e.name === 'QuotaExceededError') return true;
  return false;
}
