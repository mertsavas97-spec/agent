/**
 * Thin analytics wrapper — no Firebase Analytics dependency required yet.
 * Owner can set a sink (GA4 / Amplitude) via setAnalyticsSink without UI churn.
 */

export type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type AnalyticsSink = (event: string, params?: AnalyticsParams) => void;

export const AnalyticsEvents = {
  rewardedExtraGranted: 'rewarded_extra_granted',
  multiBatchUnlocked: 'multi_batch_unlocked',
  solveCompleted: 'solve_completed',
  reviewPrompted: 'review_prompted',
} as const;

let sink: AnalyticsSink = () => {
  /* no-op until owner wires GA */
};

const buffer: { event: string; params?: AnalyticsParams }[] = [];
const MAX_BUFFER = 40;

export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next ?? (() => undefined);
}

export function track(event: string, params?: AnalyticsParams): void {
  try {
    if (buffer.length < MAX_BUFFER) {
      buffer.push({ event, params });
    }
    sink(event, params);
  } catch {
    /* analytics must never break product paths */
  }
}

/** Test helper */
export function __drainAnalyticsBufferForTests(): {
  event: string;
  params?: AnalyticsParams;
}[] {
  return buffer.splice(0, buffer.length);
}

export function __resetAnalyticsForTests(): void {
  buffer.length = 0;
  sink = () => undefined;
}
