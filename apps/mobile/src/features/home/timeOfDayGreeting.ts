/**
 * Clock-aware home greeting — local device time, guardian-safe copy.
 */

export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'night';

/** Pure helper — pass a Date for tests. */
export function timeOfDayBucket(now: Date = new Date()): TimeOfDayBucket {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function greetingForTimeOfDay(now: Date = new Date()): string {
  switch (timeOfDayBucket(now)) {
    case 'morning':
      return 'Günaydın';
    case 'afternoon':
      return 'İyi günler';
    case 'evening':
      return 'İyi akşamlar';
    case 'night':
      return 'İyi geceler';
  }
}
