/**
 * Backend-less (device-local) notification schedules.
 * Uses expo-notifications — no FCM/APNs server. Prefs + PUSH_COPY drive content.
 *
 * Inactive users (no local solves yet): at most one weekly gentle nudge.
 * After the first solve, full category schedules apply.
 *
 * Dynamic require: old native builds without ExpoPushTokenManager must not crash
 * when Metro serves newer JS (dev-client without rebuild).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { hasLocalSolveActivity } from '@/src/features/history/localHistoryStore';
import {
  pickPushCopy,
  type PushCategoryId,
  type PushPrefs,
} from './pushPrefs';
import { hasExpoNativeModule } from '@/src/lib/hasExpoNativeModule';

const LAST_INDEX_KEY = '@cozbil/push_last_index_v1';

/** Internal schedule id — not a user-facing prefs category. */
export const INACTIVE_WEEKLY_NOTIF_ID = 'cozbil.push.inactiveWeekly';

export const LOCAL_PUSH_STATUS_COPY = {
  title: 'Cihaz içi hatırlatmalar açık',
  body: 'Sunucu yok — bildirimler bu telefonda zamanlanır. Hiç soru çözmediysen haftada en fazla bir nazik davet; ilk çözümden sonra açtığın kategoriler için günlük/haftalık hatırlatma kurulur.',
} as const;

/** Soft invite for install-but-never-solved users (no “eksik/zayıf konu” copy). */
export const INACTIVE_WEEKLY_COPY: { title: string; body: string }[] = [
  {
    title: 'İlk sorunu çekmeye hazır mısın?',
    body: 'Kitaptan bir sayfa seç; ÇözBil adım adım yardımcı olsun.',
  },
  {
    title: 'Bugün bir dakikan var mı?',
    body: 'Tek fotoğraf, kısa bir çözüm. İstediğin zaman başla.',
  },
  {
    title: 'ÇözBil seni bekliyor',
    body: 'LGS, YGS, KPSS veya Ehliyet — ilk sorunu çekerek başla.',
  },
];

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

/** One weekly slot for never-solved installs (Sunday 11:00). */
const INACTIVE_WEEKLY_TRIGGER = {
  type: 'weekly' as const,
  weekday: 1,
  hour: 11,
  minute: 0,
};

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
  // expo-notifications index eagerly loads PushTokenManager — skip if absent.
  if (!hasExpoNativeModule('ExpoPushTokenManager')) {
    cachedNotifications = null;
    return null;
  }
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

async function loadLastIndexes(): Promise<Partial<Record<PushCategoryId | 'inactiveWeekly', number>>> {
  try {
    const raw = await AsyncStorage.getItem(LAST_INDEX_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<PushCategoryId | 'inactiveWeekly', number>>;
  } catch {
    return {};
  }
}

async function saveLastIndex(
  category: PushCategoryId | 'inactiveWeekly',
  index: number,
): Promise<void> {
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

async function cancelById(
  Notifications: NotificationsModule,
  identifier: string,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    /* already gone */
  }
}

async function cancelCategory(
  Notifications: NotificationsModule,
  category: PushCategoryId,
): Promise<void> {
  await cancelById(Notifications, notifId(category));
}

async function cancelAllCategoryPlans(Notifications: NotificationsModule): Promise<void> {
  for (const plan of PLANS) {
    await cancelCategory(Notifications, plan.id);
  }
}

function pickInactiveCopy(lastIndex = -1): { title: string; body: string; index: number } {
  const list = INACTIVE_WEEKLY_COPY;
  let index = Math.floor(Math.random() * list.length);
  if (list.length > 1 && index === lastIndex) {
    index = (index + 1) % list.length;
  }
  return { ...list[index]!, index };
}

async function scheduleInactiveWeekly(Notifications: NotificationsModule): Promise<void> {
  const last = await loadLastIndexes();
  const copy = pickInactiveCopy(last.inactiveWeekly ?? -1);
  await saveLastIndex('inactiveWeekly', copy.index);
  await cancelById(Notifications, INACTIVE_WEEKLY_NOTIF_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: INACTIVE_WEEKLY_NOTIF_ID,
    content: {
      title: copy.title,
      body: copy.body,
      sound: true,
      data: { category: 'inactiveWeekly', source: 'local' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: INACTIVE_WEEKLY_TRIGGER.weekday,
      hour: INACTIVE_WEEKLY_TRIGGER.hour,
      minute: INACTIVE_WEEKLY_TRIGGER.minute,
    },
  });
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
  scheduled: (PushCategoryId | 'inactiveWeekly')[];
  permissionGranted: boolean;
  /** True when device has no local solves yet — weekly-only cadence. */
  inactiveMode: boolean;
};

/**
 * Apply prefs → cancel disabled categories, schedule enabled ones with PUSH_COPY.
 * Never-solved installs get a single weekly nudge instead of daily/streak/weakTopic spam.
 */
export async function syncLocalPushSchedules(prefs: PushPrefs): Promise<LocalPushSyncResult> {
  const Notifications = loadNotifications();
  if (!Notifications) {
    return { ok: false, scheduled: [], permissionGranted: false, inactiveMode: false };
  }
  ensureHandler(Notifications);
  const scheduled: (PushCategoryId | 'inactiveWeekly')[] = [];
  const inactiveMode = !(await hasLocalSolveActivity());

  if (!prefs.master) {
    await cancelAllCategoryPlans(Notifications);
    await cancelById(Notifications, INACTIVE_WEEKLY_NOTIF_ID);
    return { ok: true, scheduled, permissionGranted: false, inactiveMode };
  }

  const permissionGranted = await ensureLocalPushPermission();
  if (!permissionGranted) {
    await cancelAllCategoryPlans(Notifications);
    await cancelById(Notifications, INACTIVE_WEEKLY_NOTIF_ID);
    return { ok: false, scheduled, permissionGranted: false, inactiveMode };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('cozbil-reminders', {
      name: 'ÇözBil hatırlatmalar',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (inactiveMode) {
    await cancelAllCategoryPlans(Notifications);
    await scheduleInactiveWeekly(Notifications);
    scheduled.push('inactiveWeekly');
    return { ok: true, scheduled, permissionGranted: true, inactiveMode: true };
  }

  await cancelById(Notifications, INACTIVE_WEEKLY_NOTIF_ID);

  for (const plan of PLANS) {
    if (!prefs[plan.id]) {
      await cancelCategory(Notifications, plan.id);
      continue;
    }
    await scheduleCategory(Notifications, plan);
    scheduled.push(plan.id);
  }

  return { ok: true, scheduled, permissionGranted: true, inactiveMode: false };
}

/** Boot hook — load prefs and sync schedules. */
export async function bootLocalPush(loadPrefs: () => Promise<PushPrefs>): Promise<LocalPushSyncResult> {
  const prefs = await loadPrefs();
  return syncLocalPushSchedules(prefs);
}

/** Call after the first successful solve so full schedules replace inactive weekly. */
export async function refreshLocalPushAfterSolve(
  loadPrefs: () => Promise<PushPrefs>,
): Promise<LocalPushSyncResult> {
  return bootLocalPush(loadPrefs);
}
