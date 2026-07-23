import {
  AnalyticsEvents,
  __drainAnalyticsBufferForTests,
  __resetAnalyticsForTests,
  setAnalyticsSink,
  track,
} from '@/src/lib/analytics';

describe('analytics wrapper', () => {
  beforeEach(() => {
    __resetAnalyticsForTests();
  });

  it('buffers events and forwards to sink', () => {
    const sink = jest.fn();
    setAnalyticsSink(sink);
    track(AnalyticsEvents.rewardedExtraGranted, { remainingToday: 2 });
    expect(sink).toHaveBeenCalledWith(AnalyticsEvents.rewardedExtraGranted, {
      remainingToday: 2,
    });
    expect(__drainAnalyticsBufferForTests()).toEqual([
      {
        event: AnalyticsEvents.rewardedExtraGranted,
        params: { remainingToday: 2 },
      },
    ]);
  });

  it('never throws when sink fails', () => {
    setAnalyticsSink(() => {
      throw new Error('sink down');
    });
    expect(() => track('x')).not.toThrow();
  });
});
