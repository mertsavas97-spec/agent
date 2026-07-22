import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  currentIstanbulWeekMondayToSunday,
  istanbulDateKey,
  previousIstanbulDate,
  streakFromActiveDates,
} from '@/src/features/stats/istanbulDates';

const STORAGE_KEY = 'cozbil.localStreak.v1';

export type LocalStreakState = {
  streakCount: number;
  streakLastActiveDate: string | null;
  /** Istanbul YYYY-MM-DD days with at least one successful solve. */
  activeDates: string[];
};

const EMPTY: LocalStreakState = {
  streakCount: 0,
  streakLastActiveDate: null,
  activeDates: [],
};

async function readState(): Promise<LocalStreakState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, activeDates: [] };
    const parsed = JSON.parse(raw) as Partial<LocalStreakState>;
    return {
      streakCount:
        typeof parsed.streakCount === 'number' && parsed.streakCount > 0
          ? Math.floor(parsed.streakCount)
          : 0,
      streakLastActiveDate:
        typeof parsed.streakLastActiveDate === 'string'
          ? parsed.streakLastActiveDate
          : null,
      activeDates: Array.isArray(parsed.activeDates)
        ? parsed.activeDates.filter((d) => typeof d === 'string')
        : [],
    };
  } catch {
    return { ...EMPTY, activeDates: [] };
  }
}

async function writeState(state: LocalStreakState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Same rules as functions/src/progress/streak.ts nextStreakCount. */
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

/** Call after a successful solve (proxy or server). */
export async function recordLocalSolveStreak(
  today = istanbulDateKey(),
): Promise<LocalStreakState> {
  const prev = await readState();
  const next = nextStreakCount({
    streakCount: prev.streakCount,
    streakLastActiveDate: prev.streakLastActiveDate,
    today,
  });
  const activeSet = new Set(prev.activeDates);
  activeSet.add(today);
  // Keep last ~60 days for week UI
  const activeDates = [...activeSet].sort().slice(-60);
  const state: LocalStreakState = {
    streakCount: next.streakCount,
    streakLastActiveDate: next.streakLastActiveDate,
    activeDates,
  };
  await writeState(state);
  return state;
}

export async function loadLocalStreakState(): Promise<LocalStreakState> {
  return readState();
}

export type HomeStreakView = {
  streakCount: number;
  /** Mon→Sun Istanbul week; true = that day has a solve. */
  weekFilled: boolean[];
  weekLabels: string[];
};

const WEEK_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/**
 * Merge remote Firestore streak with local dogfood streak for home UI.
 */
export function buildHomeStreakView(input: {
  remoteStreakCount?: number;
  remoteLastActiveDate?: string | null;
  local: LocalStreakState;
  today?: string;
}): HomeStreakView {
  const today = input.today ?? istanbulDateKey();
  const remoteRaw =
    typeof input.remoteStreakCount === 'number' && input.remoteStreakCount > 0
      ? Math.floor(input.remoteStreakCount)
      : 0;
  // Legacy user docs may lack streakLastActiveDate — still show the count.
  const remoteDisplay = input.remoteLastActiveDate
    ? displayStreakCount({
        streakCount: remoteRaw,
        streakLastActiveDate: input.remoteLastActiveDate,
        today,
      })
    : remoteRaw;
  const localDisplay = displayStreakCount({
    streakCount: input.local.streakCount,
    streakLastActiveDate: input.local.streakLastActiveDate,
    today,
  });
  const active = new Set(input.local.activeDates);
  if (input.remoteLastActiveDate) active.add(input.remoteLastActiveDate);
  if (remoteDisplay > 0 && localDisplay === 0 && !active.has(today)) {
    // Remote-only streak: mark today so the week chip isn't empty.
    active.add(today);
  }
  const week = currentIstanbulWeekMondayToSunday(today);
  const weekFilled = week.map((d) => active.has(d));
  const fromDates = streakFromActiveDates(active, today);
  const streakCount = Math.max(remoteDisplay, localDisplay, fromDates);
  return {
    streakCount,
    weekFilled,
    weekLabels: WEEK_LABELS,
  };
}

/** Test helper */
export async function __resetLocalStreakForTests(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
