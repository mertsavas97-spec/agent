/**
 * Push notification preferences + copy variants (MVP 1.0).
 * Delivery is device-local via `localPush` (no FCM/APNs server).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type PushCategoryId =
  | 'streak'
  | 'dailyReminder'
  | 'weakTopic'
  | 'quotaReset'
  | 'premiumOffer'
  | 'productUpdate';

export type PushCategory = {
  id: PushCategoryId;
  title: string;
  description: string;
  defaultOn: boolean;
};

export const PUSH_CATEGORIES: PushCategory[] = [
  {
    id: 'streak',
    title: 'Seri hatırlatması',
    description: 'Serin kopmasın diye nazik uyarılar.',
    defaultOn: true,
  },
  {
    id: 'dailyReminder',
    title: 'Günlük çalışma',
    description: 'Seçtiğin saatte “bugün bir soru” daveti.',
    defaultOn: true,
  },
  {
    id: 'weakTopic',
    title: 'Zayıf konu',
    description: 'İstatistikteki zayıf konuya mini hatırlatma.',
    defaultOn: true,
  },
  {
    id: 'quotaReset',
    title: 'Hak yenilendi',
    description: 'Ücretsiz günlük haklar sıfırlanınca haber ver.',
    defaultOn: false,
  },
  {
    id: 'premiumOffer',
    title: 'Premium fırsatları',
    description: 'İndirim ve plan önerileri (seyrek).',
    defaultOn: false,
  },
  {
    id: 'productUpdate',
    title: 'Ürün güncellemeleri',
    description: 'Yeni sınav paketi / özellik duyuruları.',
    defaultOn: true,
  },
];

/** Multiple wordings per category — never ship the same push twice in a row. */
export const PUSH_COPY: Record<PushCategoryId, { title: string; body: string }[]> = {
  streak: [
    {
      title: 'Serin seni bekliyor',
      body: 'Bugün tek bir soru yeter — dünü de yanına alırsın.',
    },
    {
      title: 'Koparma, tamamla',
      body: 'Bir fotoğraf, bir çözüm. Seri orada kalsın.',
    },
    {
      title: 'Küçük adım, büyük alışkanlık',
      body: 'Defterden bir soru çek; serin devam etsin.',
    },
  ],
  dailyReminder: [
    {
      title: 'Bugünün sorusu hazır',
      body: 'Kitaptan bir sayfa seç, ÇözBil adım adım anlatsın.',
    },
    {
      title: '10 dakikalık sprint',
      body: 'Kısa bir oturum: çek, çöz, kontrol et.',
    },
    {
      title: 'Sınav temposu şimdi',
      body: 'LGS · YGS · KPSS · Ehliyet — hangisiyse, bir soruyla başla.',
    },
  ],
  weakTopic: [
    {
      title: 'Zayıf konu seni çağırıyor',
      body: 'İstatistikteki o başlığa bak — kısa bir anlatım fark eder.',
    },
    {
      title: 'Bugün netleştir',
      body: 'Takıldığın konuyu aç; örnek soruyla pekiştir.',
    },
    {
      title: 'Eksik halkayı tamamla',
      body: 'Bir konu anlatımı + bir fotoğraf çözüm = daha sağlam.',
    },
  ],
  quotaReset: [
    {
      title: 'Hakların yenilendi',
      body: 'Bugünkü ücretsiz soru hakkın hazır. İstersen Premium ile sınırsız.',
    },
    {
      title: 'Yeni gün, yeni hak',
      body: '5 ücretsiz çözüm seni bekliyor. Haydi bir tanesini kullan.',
    },
    {
      title: 'Sayaç sıfırlandı',
      body: 'İstanbul gününe göre hakların taze. İlk soruyu çek.',
    },
  ],
  premiumOffer: [
    {
      title: 'Yıllıkta %32 indirim',
      body: '320 TL / yıl — ayda ≈27 TL. Reklamsız, sınırsız çözüm.',
    },
    {
      title: 'Odak bozulmasın',
      body: 'Premium: reklamsız alan + kişisel AI özeti. Bir haftalıkla da dene.',
    },
    {
      title: 'Sınırsız tempo',
      body: 'Günlük hak yetmiyorsa Premium’a geç; dershane cebinde.',
    },
  ],
  productUpdate: [
    {
      title: 'Yenilik var',
      body: 'Konu anlatımları ve istatistikler daha net. Bir tur at.',
    },
    {
      title: 'ÇözBil güncellendi',
      body: 'Daha akıcı çoklu çözüm ve sınav temaları seni bekliyor.',
    },
    {
      title: 'Küçük ama işe yarar',
      body: 'Arayüz cilalandı — fotoğraf çek, farkı gör.',
    },
  ],
};

export type PushPrefs = Record<PushCategoryId, boolean> & { master: boolean };

const KEY = '@cozbil/push_prefs_v1';

function defaults(): PushPrefs {
  const base = { master: true } as PushPrefs;
  for (const c of PUSH_CATEGORIES) {
    base[c.id] = c.defaultOn;
  }
  return base;
}

let cache: PushPrefs | null = null;

export async function loadPushPrefs(): Promise<PushPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      cache = defaults();
      return cache;
    }
    cache = { ...defaults(), ...(JSON.parse(raw) as Partial<PushPrefs>) };
    return cache;
  } catch {
    cache = defaults();
    return cache;
  }
}

export function peekPushPrefs(): PushPrefs {
  return cache ?? defaults();
}

export async function savePushPrefs(next: PushPrefs): Promise<void> {
  cache = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function setPushCategory(
  id: PushCategoryId | 'master',
  value: boolean,
): Promise<PushPrefs> {
  const cur = await loadPushPrefs();
  const next = { ...cur, [id]: value };
  await savePushPrefs(next);
  return next;
}

/** Pick a variant; pass lastIndex to avoid immediate repeat. */
export function pickPushCopy(
  category: PushCategoryId,
  lastIndex = -1,
): { title: string; body: string; index: number } {
  const list = PUSH_COPY[category];
  let index = Math.floor(Math.random() * list.length);
  if (list.length > 1 && index === lastIndex) {
    index = (index + 1) % list.length;
  }
  return { ...list[index]!, index };
}
