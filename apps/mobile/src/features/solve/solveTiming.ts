/** Shared solve latency budgets. Kept dependency-free for timer regression tests. */

/**
 * Dogfood proxy does multi-pass Tesseract over a phone JPEG through a tunnel.
 * 15s was aborting mid-OCR → "Çözüm alınamadı" while the UI sat at ~97%.
 */
export const PROXY_TIMEOUT_MS = 55_000;
/** Firestore pending-doc wait — keep snappy; proxy is the dogfood path. */
export const PENDING_STUCK_MS = 15_000;
export const SOLVE_TIMEOUT_MS = 60_000;
/** Match proxy budget so the bar keeps moving until a real answer/error. */
export const SOLVE_PROGRESS_CRAWL_MS = 50_000;
/** Soft ceiling while waiting on the backend (never hard-stop at 92). */
export const SOLVE_PROGRESS_CRAWL_TARGET = 0.99;
