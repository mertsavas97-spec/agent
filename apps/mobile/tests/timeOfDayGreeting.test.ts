import {
  greetingForTimeOfDay,
  timeOfDayBucket,
} from '@/src/features/home/timeOfDayGreeting';

function atHour(hour: number): Date {
  return new Date(2026, 6, 23, hour, 15, 0);
}

describe('timeOfDayGreeting', () => {
  it('maps hours to buckets', () => {
    expect(timeOfDayBucket(atHour(7))).toBe('morning');
    expect(timeOfDayBucket(atHour(14))).toBe('afternoon');
    expect(timeOfDayBucket(atHour(19))).toBe('evening');
    expect(timeOfDayBucket(atHour(23))).toBe('night');
    expect(timeOfDayBucket(atHour(2))).toBe('night');
  });

  it('returns Turkish greetings for each bucket', () => {
    expect(greetingForTimeOfDay(atHour(8))).toBe('Günaydın');
    expect(greetingForTimeOfDay(atHour(13))).toBe('İyi günler');
    expect(greetingForTimeOfDay(atHour(20))).toBe('İyi akşamlar');
    expect(greetingForTimeOfDay(atHour(0))).toBe('İyi geceler');
  });
});
