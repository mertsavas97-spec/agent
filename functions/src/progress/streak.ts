/** Streak rules for Europe/Istanbul calendar days (YYYY-MM-DD). */

export function istanbulDateString(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
}

/** Yesterday relative to `today` (YYYY-MM-DD) in Istanbul. */
export function previousIstanbulDate(today: string): string {
  const [y, m, day] = today.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return utc.toISOString().slice(0, 10);
}

/**
 * Given last active Istanbul date and current streak, return next streak after a solve today.
 * - same day → unchanged
 * - yesterday → +1
 * - gap → reset to 1
 * - never active → 1
 */
export function nextStreakCount(input: {
  streakCount: number;
  streakLastActiveDate: string | null;
  today: string;
}): { streakCount: number; streakLastActiveDate: string } {
  const { streakLastActiveDate, today } = input;
  if (streakLastActiveDate === today) {
    return {
      streakCount: Math.max(1, input.streakCount),
      streakLastActiveDate: today,
    };
  }
  if (streakLastActiveDate === previousIstanbulDate(today)) {
    return {
      streakCount: Math.max(1, input.streakCount) + 1,
      streakLastActiveDate: today,
    };
  }
  return { streakCount: 1, streakLastActiveDate: today };
}

/** Display streak: 0 if last active before yesterday (broken). */
export function displayStreakCount(input: {
  streakCount: number;
  streakLastActiveDate: string | null;
  today: string;
}): number {
  if (!input.streakLastActiveDate || input.streakCount <= 0) return 0;
  if (input.streakLastActiveDate === input.today) return input.streakCount;
  if (input.streakLastActiveDate === previousIstanbulDate(input.today)) {
    return input.streakCount;
  }
  return 0;
}
