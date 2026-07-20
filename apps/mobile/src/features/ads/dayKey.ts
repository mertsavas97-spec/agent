/** Istanbul calendar day key (YYYY-MM-DD) — mirrors functions quota. */
export function istanbulDateKey(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
}
