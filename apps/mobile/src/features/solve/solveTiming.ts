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
/** Firestore pending-doc wait — trigger hiç gelmezse hızlı fail. */
export const PENDING_STUCK_MS = 12_000;
/**
 * Status `running` olup `done` yazılmazsa (Vertex/Vision takılması).
 * Client’ın 48s+ boş beklemesini keser.
 */
export const RUNNING_STUCK_MS = 28_000;
/**
 * Firestore pending → done hard cap (primary path).
 * Must leave headroom: FIRESTORE_FALLBACK_MS + SOLVE_TIMEOUT_MS
 * ≤ SOLVE_UI_SETTLE_MS.
 */
export const SOLVE_TIMEOUT_MS = 40_000;
/**
 * Analyzing UI must leave this screen even if a native fetch ignores abort.
 */
export const SOLVE_UI_SETTLE_MS = 55_000;
/** Soft crawl across the wait so the bar does not jump then freeze. */
export const SOLVE_PROGRESS_CRAWL_MS = 45_000;
/** Soft ceiling while waiting on the backend (never claim 100% early). */
export const SOLVE_PROGRESS_CRAWL_TARGET = 0.97;
