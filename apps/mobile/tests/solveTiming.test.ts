import {
  FIRESTORE_FALLBACK_MS,
  PENDING_STUCK_MS,
  PROXY_TIMEOUT_MS,
  RUNNING_STUCK_MS,
  SOLVE_PROGRESS_CRAWL_MS,
  SOLVE_PROGRESS_CRAWL_TARGET,
  SOLVE_TIMEOUT_MS,
  SOLVE_UI_SETTLE_MS,
} from '@/src/features/solve/solveTiming';

describe('solve latency budgets', () => {
  it('fails a missing trigger near the historical 15-second UX budget', () => {
    expect(PENDING_STUCK_MS).toBeLessThanOrEqual(15_000);
  });

  it('cuts a stuck running pipeline before the hard Firestore cap', () => {
    expect(RUNNING_STUCK_MS).toBeLessThan(SOLVE_TIMEOUT_MS);
    expect(RUNNING_STUCK_MS).toBeGreaterThan(PENDING_STUCK_MS);
  });

  it('bounds proxy and total server waits', () => {
    // Proxy must outlive multi-pass phone OCR + tunnel upload.
    expect(PROXY_TIMEOUT_MS).toBeGreaterThanOrEqual(40_000);
    expect(PROXY_TIMEOUT_MS).toBeLessThanOrEqual(SOLVE_TIMEOUT_MS + 10_000);
    expect(SOLVE_TIMEOUT_MS).toBeLessThanOrEqual(90_000);
    expect(FIRESTORE_FALLBACK_MS).toBeLessThanOrEqual(15_000);
    expect(SOLVE_UI_SETTLE_MS).toBeGreaterThan(SOLVE_TIMEOUT_MS);
    // Upload + primary Firestore must finish before UI settle kills the screen.
    expect(FIRESTORE_FALLBACK_MS + SOLVE_TIMEOUT_MS).toBeLessThanOrEqual(
      SOLVE_UI_SETTLE_MS,
    );
  });

  it('keeps the progress crawl aligned with the UI wait', () => {
    expect(SOLVE_PROGRESS_CRAWL_MS).toBeGreaterThanOrEqual(35_000);
    expect(SOLVE_PROGRESS_CRAWL_MS).toBeLessThanOrEqual(SOLVE_UI_SETTLE_MS);
    expect(SOLVE_PROGRESS_CRAWL_TARGET).toBeGreaterThan(0.92);
    expect(SOLVE_PROGRESS_CRAWL_TARGET).toBeLessThanOrEqual(0.99);
  });
});
