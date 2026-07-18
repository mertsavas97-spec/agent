import {
  displayStreakCount,
  nextStreakCount,
  previousIstanbulDate,
} from '../src/progress/streak';

describe('streak', () => {
  it('increments when last active was yesterday', () => {
    const today = '2026-07-18';
    const yesterday = previousIstanbulDate(today);
    expect(
      nextStreakCount({
        streakCount: 2,
        streakLastActiveDate: yesterday,
        today,
      }),
    ).toEqual({ streakCount: 3, streakLastActiveDate: today });
  });

  it('resets after a gap', () => {
    expect(
      nextStreakCount({
        streakCount: 5,
        streakLastActiveDate: '2026-07-10',
        today: '2026-07-18',
      }),
    ).toEqual({ streakCount: 1, streakLastActiveDate: '2026-07-18' });
  });

  it('same day keeps streak', () => {
    expect(
      nextStreakCount({
        streakCount: 4,
        streakLastActiveDate: '2026-07-18',
        today: '2026-07-18',
      }).streakCount,
    ).toBe(4);
  });

  it('display streak zero after break', () => {
    expect(
      displayStreakCount({
        streakCount: 3,
        streakLastActiveDate: '2026-07-10',
        today: '2026-07-18',
      }),
    ).toBe(0);
  });
});
