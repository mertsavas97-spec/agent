import { istanbulDateKey } from '@/src/features/ads/dayKey';

/** Yesterday relative to `today` (YYYY-MM-DD) in Istanbul calendar. */
export function previousIstanbulDate(today: string): string {
  const [y, m, day] = today.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return utc.toISOString().slice(0, 10);
}

/** Next calendar day (YYYY-MM-DD). */
export function nextIstanbulDate(today: string): string {
  const [y, m, day] = today.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day));
  utc.setUTCDate(utc.getUTCDate() + 1);
  return utc.toISOString().slice(0, 10);
}

/**
 * UTC weekday for a calendar date key (0=Sun … 6=Sat).
 * Date-only keys are treated as civil days (TR graphs).
 */
function civilWeekdaySun0(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Current week Mon→Sun containing `today` (hafta başı Pazartesi).
 */
export function currentIstanbulWeekMondayToSunday(
  today = istanbulDateKey(),
): string[] {
  const dow = civilWeekdaySun0(today); // 0 Sun … 6 Sat
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  let monday = today;
  for (let i = 0; i < daysFromMonday; i++) {
    monday = previousIstanbulDate(monday);
  }
  const days: string[] = [monday];
  let cursor = monday;
  for (let i = 1; i < 7; i++) {
    cursor = nextIstanbulDate(cursor);
    days.push(cursor);
  }
  return days;
}

/** @deprecated Prefer currentIstanbulWeekMondayToSunday for stats charts */
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
