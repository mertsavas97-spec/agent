/** Shared solve latency budgets. Kept dependency-free for timer regression tests. */
export const PROXY_TIMEOUT_MS = 15_000;
export const PENDING_STUCK_MS = 15_000;
export const SOLVE_TIMEOUT_MS = 60_000;
/** UI crawl for the solve step — fast enough to feel alive, not a 92% freeze. */
export const SOLVE_PROGRESS_CRAWL_MS = 12_000;
/** Soft ceiling while waiting on the backend (never hard-stop at 92). */
export const SOLVE_PROGRESS_CRAWL_TARGET = 0.97;
