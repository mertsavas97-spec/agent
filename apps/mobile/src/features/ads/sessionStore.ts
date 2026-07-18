import { istanbulDateKey } from './dayKey';

type DayCounters = {
  day: string;
  interstitialShown: number;
  rewardedClaimed: number;
};

let counters: DayCounters = {
  day: istanbulDateKey(),
  interstitialShown: 0,
  rewardedClaimed: 0,
};

function roll(): DayCounters {
  const today = istanbulDateKey();
  if (counters.day !== today) {
    counters = { day: today, interstitialShown: 0, rewardedClaimed: 0 };
  }
  return counters;
}

export function getAdDayCounters(): DayCounters {
  return { ...roll() };
}

export function markInterstitialShown(): void {
  const c = roll();
  c.interstitialShown += 1;
}

export function markRewardedClaimed(): void {
  const c = roll();
  c.rewardedClaimed += 1;
}

/** Test helper */
export function __resetAdDayCountersForTests(): void {
  counters = { day: istanbulDateKey(), interstitialShown: 0, rewardedClaimed: 0 };
}
