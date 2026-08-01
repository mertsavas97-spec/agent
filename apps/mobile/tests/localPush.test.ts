import {
  INACTIVE_WEEKLY_COPY,
  INACTIVE_WEEKLY_NOTIF_ID,
  LOCAL_PUSH_STATUS_COPY,
  __resetNotificationsCacheForTests,
  syncLocalPushSchedules,
} from '@/src/features/push/localPush';
import { PUSH_COPY, type PushPrefs } from '@/src/features/push/pushPrefs';

const mockCancelScheduledNotificationAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn().mockResolvedValue('id');
const mockGetPermissionsAsync = jest.fn().mockResolvedValue({ granted: true });
const mockRequestPermissionsAsync = jest.fn().mockResolvedValue({ granted: true });
const mockSetNotificationHandler = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockHasLocalSolveActivity = jest.fn().mockResolvedValue(true);

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
  },
  IosAuthorizationStatus: { PROVISIONAL: 1 },
  AndroidImportance: { DEFAULT: 3 },
  setNotificationHandler: (...args: unknown[]) => mockSetNotificationHandler(...args),
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    mockCancelScheduledNotificationAsync(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
}));

jest.mock('@/src/lib/hasExpoNativeModule', () => ({
  hasExpoNativeModule: jest.fn(() => true),
}));

jest.mock('@/src/features/history/localHistoryStore', () => ({
  hasLocalSolveActivity: (...args: unknown[]) => mockHasLocalSolveActivity(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

function prefs(partial: Partial<PushPrefs> = {}): PushPrefs {
  return {
    master: true,
    streak: true,
    dailyReminder: true,
    weakTopic: false,
    quotaReset: false,
    premiumOffer: false,
    productUpdate: false,
    ...partial,
  };
}

describe('localPush', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetNotificationsCacheForTests();
    mockHasLocalSolveActivity.mockResolvedValue(true);
  });

  it('ships honest device-local status copy', () => {
    expect(LOCAL_PUSH_STATUS_COPY.title).toMatch(/Cihaz içi/i);
    expect(LOCAL_PUSH_STATUS_COPY.body).toMatch(/Sunucu yok/i);
    expect(LOCAL_PUSH_STATUS_COPY.body).toMatch(/haftada en fazla bir/i);
    expect(LOCAL_PUSH_STATUS_COPY.body.length).toBeGreaterThan(40);
  });

  it('schedules enabled categories with PUSH_COPY titles when user has solves', async () => {
    const result = await syncLocalPushSchedules(prefs());
    expect(result.ok).toBe(true);
    expect(result.inactiveMode).toBe(false);
    expect(result.scheduled).toEqual(expect.arrayContaining(['dailyReminder', 'streak']));
    expect(mockScheduleNotificationAsync).toHaveBeenCalled();
    const titles = mockScheduleNotificationAsync.mock.calls.map(
      (c) => (c[0] as { content: { title: string } }).content.title,
    );
    const known = new Set(
      [...PUSH_COPY.dailyReminder, ...PUSH_COPY.streak].map((v) => v.title),
    );
    for (const t of titles) {
      expect(known.has(t)).toBe(true);
    }
  });

  it('cancels all when master is off', async () => {
    await syncLocalPushSchedules(prefs({ master: false }));
    expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalled();
  });

  it('returns ok:false when expo-notifications native module is missing', async () => {
    const { hasExpoNativeModule } = require('@/src/lib/hasExpoNativeModule') as {
      hasExpoNativeModule: jest.Mock;
    };
    hasExpoNativeModule.mockReturnValue(false);
    __resetNotificationsCacheForTests();
    const result = await syncLocalPushSchedules(prefs());
    expect(result.ok).toBe(false);
    expect(result.scheduled).toEqual([]);
    hasExpoNativeModule.mockReturnValue(true);
  });

  it('schedules only one weekly nudge when user never solved', async () => {
    mockHasLocalSolveActivity.mockResolvedValue(false);
    const result = await syncLocalPushSchedules(
      prefs({ weakTopic: true, productUpdate: true, streak: true }),
    );
    expect(result.ok).toBe(true);
    expect(result.inactiveMode).toBe(true);
    expect(result.scheduled).toEqual(['inactiveWeekly']);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const scheduled = mockScheduleNotificationAsync.mock.calls[0]![0] as {
      identifier: string;
      content: { title: string; body: string };
      trigger: { type: string };
    };
    expect(scheduled.identifier).toBe(INACTIVE_WEEKLY_NOTIF_ID);
    expect(scheduled.trigger.type).toBe('weekly');
    const inactiveTitles = new Set(INACTIVE_WEEKLY_COPY.map((c) => c.title));
    expect(inactiveTitles.has(scheduled.content.title)).toBe(true);
    expect(scheduled.content.body).not.toMatch(/eksik|zayıf/i);
    // Category plans cancelled (streak/daily/weak/…) plus may cancel inactive before reschedule
    expect(mockCancelScheduledNotificationAsync.mock.calls.length).toBeGreaterThanOrEqual(6);
  });

  it('inactive weekly copy never uses weak-topic / gap language', () => {
    for (const row of INACTIVE_WEEKLY_COPY) {
      expect(`${row.title} ${row.body}`).not.toMatch(/eksik|zayıf konu|istatistik/i);
    }
  });
});
