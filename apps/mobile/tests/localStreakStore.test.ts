import {
  buildHomeStreakView,
  displayStreakCount,
  nextStreakCount,
  recordLocalSolveStreak,
  __resetLocalStreakForTests,
} from '@/src/features/stats/localStreakStore';

describe('local streak', () => {
  beforeEach(async () => {
    await __resetLocalStreakForTests();
  });

  it('bumps streak across consecutive Istanbul days', () => {
    expect(
      nextStreakCount({
        streakCount: 2,
        streakLastActiveDate: '2026-07-21',
        today: '2026-07-22',
      }),
    ).toEqual({ streakCount: 3, streakLastActiveDate: '2026-07-22' });
  });

  it('does not double-count same day', () => {
    expect(
      nextStreakCount({
        streakCount: 3,
        streakLastActiveDate: '2026-07-22',
        today: '2026-07-22',
      }),
    ).toEqual({ streakCount: 3, streakLastActiveDate: '2026-07-22' });
  });

  it('resets after a gap', () => {
    expect(
      nextStreakCount({
        streakCount: 5,
        streakLastActiveDate: '2026-07-19',
        today: '2026-07-22',
      }),
    ).toEqual({ streakCount: 1, streakLastActiveDate: '2026-07-22' });
  });

  it('records local solve and fills today in the week view', async () => {
    await recordLocalSolveStreak('2026-07-22');
    const view = buildHomeStreakView({
      local: {
        streakCount: 1,
        streakLastActiveDate: '2026-07-22',
        activeDates: ['2026-07-22'],
      },
      today: '2026-07-22',
    });
    expect(view.streakCount).toBe(1);
    // 2026-07-22 is Wednesday → index 2 in Mon→Sun
    expect(view.weekFilled[2]).toBe(true);
    expect(view.weekFilled.filter(Boolean)).toHaveLength(1);
  });

  it('keeps remote legacy streakCount without lastActiveDate', () => {
    const view = buildHomeStreakView({
      remoteStreakCount: 3,
      remoteLastActiveDate: null,
      local: { streakCount: 0, streakLastActiveDate: null, activeDates: [] },
      today: '2026-07-22',
    });
    expect(view.streakCount).toBe(3);
    expect(view.weekFilled.some(Boolean)).toBe(true);
  });

  it('zeros display when last active is older than yesterday', () => {
    expect(
      displayStreakCount({
        streakCount: 4,
        streakLastActiveDate: '2026-07-19',
        today: '2026-07-22',
      }),
    ).toBe(0);
  });
});
