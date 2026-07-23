/**
 * Backend-less (device-local) notification schedules.
 * Uses expo-notifications — no FCM/APNs server. Prefs + PUSH_COPY drive content.
 *
 * Dynamic require: old native builds without ExpoPushTokenManager must not crash
 * when Metro serves newer JS (dev-client without rebuild).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  pickPushCopy,
  type PushCategoryId,
  type PushPrefs,
} from './pushPrefs';

const LAST_INDEX_KEY = '@cozbil/push_last_index_v1';

export const LOCAL_PUSH_STATUS_COPY = {
  title: 'Cihaz içi hatırlatmalar açık',
  body: 'Sunucu yok — bildirimler bu telefonda zamanlanır. Tercih ve metinler hazır; açtığın kategoriler için günlük/haftalık hatırlatma kurulur.',
} as const;

type SchedulePlan = {
  id: PushCategoryId;
  trigger:
    | { type: 'daily'; hour: number; minute: number }
    | { type: 'weekly'; weekday: number; hour: number; minute: number };
};

/** Local clocks — gentle study windows, not spammy. */
const PLANS: SchedulePlan[] = [
  { id: 'dailyReminder', trigger: { type: 'daily', hour: 19, minute: 0 } },
  { id: 'streak', trigger: { type: 'daily', hour: 20, minute: 30 } },
  { id: 'weakTopic', trigger: { type: 'weekly', weekday: 4, hour: 18, minute: 0 } }, // Thu
  { id: 'quotaReset', trigger: { type: 'daily', hour: 8, minute: 0 } },
  { id: 'premiumOffer', trigger: { type: 'weekly', weekday: 1, hour: 11, minute: 0 } }, // Sun=1 on iOS
  { id: 'productUpdate', trigger: { type: 'weekly', weekday: 2, hour: 12, minute: 0 } }, // Mon
];

type NotificationsModule = {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  getPermissionsAsync: () => Promise<{
    granted: boolean;
    ios?: { status?: number };
  }>;
  requestPermissionsAsync: () => Promise<{
    granted: boolean;
    ios?: { status?: number };
  }>;
  IosAuthorizationStatus: { PROVISIONAL: number };
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  scheduleNotificationAsync: (input: unknown) => Promise<string>;
  SchedulableTriggerInputTypes: { DAILY: string; WEEKLY: string };
  setNotificationChannelAsync: (id: string, opts: unknown) => Promise<unknown>;
  AndroidImportance: { DEFAULT: number };
};

let cachedNotifications: NotificationsModule | null | undefined;

function loadNotifications(): NotificationsModule | null {
  if (cachedNotifications !== undefined) return cachedNotifications;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedNotifications = require('expo-notifications') as NotificationsModule;
  } catch {
    cachedNotifications = null;
  }
  return cachedNotifications;
}

/** Test helper — clear cached native module resolution. */
export function __resetNotificationsCacheForTests(): void {
  cachedNotifications = undefined;
}

let handlerReady = false;

function ensureHandler(Notifications: NotificationsModule) {
  if (handlerReady) return;
  handlerReady = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function notifId(category: PushCategoryId): string {
  return `cozbil.push.${category}`;
}

async function loadLastIndexes(): Promise<Partial<Record<PushCategoryId, number>>> {
  try {
    const raw = await AsyncStorage.getItem(LAST_INDEX_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<PushCategoryId, number>>;
  } catch {
    return {};
  }
}

async function saveLastIndex(category: PushCategoryId, index: number): Promise<void> {
  const cur = await loadLastIndexes();
  cur[category] = index;
  await AsyncStorage.setItem(LAST_INDEX_KEY, JSON.stringify(cur));
}

export async function ensureLocalPushPermission(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  ensureHandler(Notifications);
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const asked = await Notifications.requestPermissionsAsync();
  return (
    asked.granted ||
    asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function cancelCategory(
  Notifications: NotificationsModule,
  category: PushCategoryId,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId(category));
  } catch {
    /* already gone */
  }
}

async function scheduleCategory(
  Notifications: NotificationsModule,
  plan: SchedulePlan,
): Promise<void> {
  const last = await loadLastIndexes();
  const copy = pickPushCopy(plan.id, last[plan.id] ?? -1);
  await saveLastIndex(plan.id, copy.index);
  await cancelCategory(Notifications, plan.id);

  if (plan.trigger.type === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier: notifId(plan.id),
      content: {
        title: copy.title,
        body: copy.body,
        sound: true,
        data: { category: plan.id, source: 'local' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: plan.trigger.hour,
        minute: plan.trigger.minute,
      },
    });
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: notifId(plan.id),
    content: {
      title: copy.title,
      body: copy.body,
      sound: true,
      data: { category: plan.id, source: 'local' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: plan.trigger.weekday,
      hour: plan.trigger.hour,
      minute: plan.trigger.minute,
    },
  });
}

export type LocalPushSyncResult = {
  ok: boolean;
  scheduled: PushCategoryId[];
  permissionGranted: boolean;
};

/**
 * Apply prefs → cancel disabled categories, schedule enabled ones with PUSH_COPY.
 */
export async function syncLocalPushSchedules(prefs: PushPrefs): Promise<LocalPushSyncResult> {
  const Notifications = loadNotifications();
  if (!Notifications) {
    return { ok: false, scheduled: [], permissionGranted: false };
  }
  ensureHandler(Notifications);
  const scheduled: PushCategoryId[] = [];

  if (!prefs.master) {
    for (const plan of PLANS) {
      await cancelCategory(Notifications, plan.id);
    }
    return { ok: true, scheduled, permissionGranted: false };
  }

  const permissionGranted = await ensureLocalPushPermission();
  if (!permissionGranted) {
    for (const plan of PLANS) {
      await cancelCategory(Notifications, plan.id);
    }
    return { ok: false, scheduled, permissionGranted: false };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('cozbil-reminders', {
      name: 'ÇözBil hatırlatmalar',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  for (const plan of PLANS) {
    if (!prefs[plan.id]) {
      await cancelCategory(Notifications, plan.id);
      continue;
    }
    await scheduleCategory(Notifications, plan);
    scheduled.push(plan.id);
  }

  return { ok: true, scheduled, permissionGranted: true };
}

/** Boot hook — load prefs and sync schedules. */
export async function bootLocalPush(loadPrefs: () => Promise<PushPrefs>): Promise<LocalPushSyncResult> {
  const prefs = await loadPrefs();
  return syncLocalPushSchedules(prefs);
}
