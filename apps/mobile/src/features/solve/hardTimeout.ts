/** Promise.race that always settles — RN AbortController often ignores large uploads. */

export function hardTimeoutError(label: string, ms: number): Error {
  return Object.assign(new Error(`SOLVE_TIMEOUT — ${label} (${ms}ms)`), {
    code: 'functions/deadline-exceeded',
  });
}

export function withHardTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(hardTimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}
