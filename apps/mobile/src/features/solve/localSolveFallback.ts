/**
 * Infrastructure errors must surface as errors/rejections. This module keeps
 * only shared classification helpers; the former generic "solved" fallback was
 * removed because it had no verified final answer.
 */
export function isServerSolveUnavailable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code =
    'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : '';
  const message = err instanceof Error ? err.message : String(err);
  return (
    code === 'functions/deadline-exceeded' ||
    code === 'functions/permission-denied' ||
    code === 'functions/unavailable' ||
    code === 'functions/unauthenticated' ||
    /SOLVE_TIMEOUT|SOLVE_TRIGGER|403|permission-denied|trigger/i.test(
      `${code} ${message}`,
    )
  );
}

/** Local / proxy solutions cannot call explainAgain callable. */
export function isOfflineSolutionId(
  solutionId: string | null | undefined,
): boolean {
  if (!solutionId) return true;
  return solutionId.startsWith('local-') || solutionId.startsWith('proxy-');
}
