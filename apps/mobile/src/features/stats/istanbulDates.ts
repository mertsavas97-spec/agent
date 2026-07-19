import { istanbulDateKey } from '@/src/features/ads/dayKey';

/** Yesterday relative to `today` (YYYY-MM-DD) in Istanbul calendar. */
export function previousIstanbulDate(today: string): string {
  const [y, m, day] = today.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return utc.toISOString().slice(0, 10);
}

/** Last `count` Istanbul calendar days ending at `today` (oldest → newest). */
export function lastIstanbulDays(count: number, today = istanbulDateKey()): string[] {
  const days: string[] = [];
  let cursor = today;
  for (let i = 0; i < count; i++) {
    days.unshift(cursor);
    cursor = previousIstanbulDate(cursor);
  }
  return days;
}

/**
 * Consecutive active days ending today or yesterday (display streak).
 * Mirrors functions `displayStreakCount` + walk-back.
 */
export function streakFromActiveDates(
  activeDates: Iterable<string>,
  today = istanbulDateKey(),
): number {
  const set = activeDates instanceof Set ? activeDates : new Set(activeDates);
  if (set.size === 0) return 0;

  let cursor = today;
  if (!set.has(today)) {
    cursor = previousIstanbulDate(today);
    if (!set.has(cursor)) return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = previousIstanbulDate(cursor);
  }
  return streak;
}

export { istanbulDateKey };
