/** Shared solve latency budgets. Kept dependency-free for timer regression tests. */

/**
 * Dogfood proxy does multi-pass Tesseract over a phone JPEG through a tunnel.
 * 15s was aborting mid-OCR → "Çözüm alınamadı" while the UI sat at ~97%.
 */
export const PROXY_TIMEOUT_MS = 45_000;
/**
 * Storage upload + Firestore wait after a proxy miss.
 * Must fail fast — uploadBytes can hang forever on flaky mobile networks.
 */
export const FIRESTORE_FALLBACK_MS = 12_000;
/** Firestore pending-doc wait — keep snappy; proxy is the dogfood path. */
export const PENDING_STUCK_MS = 15_000;
/** Total client budget for one solve attempt (proxy + optional fallback). */
export const SOLVE_TIMEOUT_MS = 58_000;
/**
 * Analyzing UI must leave this screen even if a native fetch ignores abort.
 * Slightly above SOLVE_TIMEOUT_MS so the inner races settle first.
 */
export const SOLVE_UI_SETTLE_MS = 65_000;
/** Match proxy budget so the bar keeps moving until a real answer/error. */
export const SOLVE_PROGRESS_CRAWL_MS = 42_000;
/** Soft ceiling while waiting on the backend (never hard-stop at 92). */
export const SOLVE_PROGRESS_CRAWL_TARGET = 0.99;
