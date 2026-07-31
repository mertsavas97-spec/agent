/** Shared solve latency budgets. Kept dependency-free for timer regression tests. */

/**
 * Dogfood proxy does multi-pass Tesseract over a phone JPEG through a tunnel.
 * 15s was aborting mid-OCR → "Çözüm alınamadı" while the UI sat at ~97%.
 */
export const PROXY_TIMEOUT_MS = 45_000;
/**
 * Storage upload budget (REST on RN). Also used for post-proxy Firestore wait.
 * Must fail fast — uploads can hang forever on flaky mobile networks.
 */
export const FIRESTORE_FALLBACK_MS = 12_000;
/** Firestore pending-doc wait — keep snappy; proxy is the dogfood path. */
export const PENDING_STUCK_MS = 15_000;
/**
 * Firestore pending → done wait when Firestore is the primary path (no proxy).
 * Must leave headroom for upload: FIRESTORE_FALLBACK_MS + SOLVE_TIMEOUT_MS
 * < SOLVE_UI_SETTLE_MS so the UI settle timer is not the first to fire.
 */
export const SOLVE_TIMEOUT_MS = 48_000;
/**
 * Analyzing UI must leave this screen even if a native fetch ignores abort.
 * Slightly above upload + Firestore worst-case sequential budget.
 */
export const SOLVE_UI_SETTLE_MS = 65_000;
/** Soft crawl across the full wait so the bar does not jump then freeze. */
export const SOLVE_PROGRESS_CRAWL_MS = 55_000;
/** Soft ceiling while waiting on the backend (never claim 100% early). */
export const SOLVE_PROGRESS_CRAWL_TARGET = 0.97;
