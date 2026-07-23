import {
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
  });

  it('ships honest device-local status copy', () => {
    expect(LOCAL_PUSH_STATUS_COPY.title).toMatch(/Cihaz içi/i);
    expect(LOCAL_PUSH_STATUS_COPY.body).toMatch(/Sunucu yok/i);
    expect(LOCAL_PUSH_STATUS_COPY.body.length).toBeGreaterThan(40);
  });

  it('schedules enabled categories with PUSH_COPY titles', async () => {
    const result = await syncLocalPushSchedules(prefs());
    expect(result.ok).toBe(true);
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
    jest.resetModules();
    jest.doMock('expo-notifications', () => {
      throw new Error("Cannot find native module 'ExpoPushTokenManager'");
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/src/features/push/localPush') as typeof import('@/src/features/push/localPush');
    mod.__resetNotificationsCacheForTests();
    const result = await mod.syncLocalPushSchedules(prefs());
    expect(result.ok).toBe(false);
    expect(result.scheduled).toEqual([]);
  });
});
