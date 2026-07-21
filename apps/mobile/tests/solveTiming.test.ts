import {
  PENDING_STUCK_MS,
  PROXY_TIMEOUT_MS,
  SOLVE_PROGRESS_CRAWL_MS,
  SOLVE_TIMEOUT_MS,
} from '@/src/features/solve/solveTiming';

describe('solve latency budgets', () => {
  it('fails a missing trigger near the historical 15-second UX budget', () => {
    expect(PENDING_STUCK_MS).toBeLessThanOrEqual(15_000);
  });

  it('bounds proxy and total server waits', () => {
    expect(PROXY_TIMEOUT_MS).toBeLessThanOrEqual(25_000);
    expect(SOLVE_TIMEOUT_MS).toBeLessThanOrEqual(60_000);
  });

  it('keeps the progress crawl aligned with a 15–20 second healthy solve', () => {
    expect(SOLVE_PROGRESS_CRAWL_MS).toBeGreaterThanOrEqual(15_000);
    expect(SOLVE_PROGRESS_CRAWL_MS).toBeLessThanOrEqual(20_000);
  });
});
