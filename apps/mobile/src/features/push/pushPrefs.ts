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
      title: 'Serini bozma',
      body: 'Bugün bir soru çöz, dünün emeği boşa gitmesin.',
    },
    {
      title: 'Seri devam etsin',
      body: 'Tek soru, bir dakika. Hepsi bu.',
    },
    {
      title: 'Küçük adım, kalıcı alışkanlık',
      body: 'Bir fotoğraf çek, seriyi sürdür.',
    },
  ],
  dailyReminder: [
    {
      title: 'Bugünün sorusu seni bekliyor',
      body: 'Kitaptan bir sayfa seç, gerisini ÇözBil halletsin.',
    },
    {
      title: '10 dakikan var mı?',
      body: 'Çek, çöz, öğren. Kısa ama etkili.',
    },
    {
      title: 'Sınav neyse, bugün ona çalış',
      body: 'LGS, YGS, KPSS, Ehliyet — bir soruyla başla.',
    },
  ],
  weakTopic: [
    {
      title: 'Bu konuda biraz destek olalım',
      body: 'İstatistiklerindeki zayıf başlığa bir bak.',
    },
    {
      title: 'Eksik kalan yeri kapat',
      body: 'Takıldığın konudan bir örnek daha çöz.',
    },
    {
      title: 'Küçük bir tekrar fark yaratır',
      body: 'Zayıf konunu bugün netleştir.',
    },
  ],
  quotaReset: [
    {
      title: 'Bugünkü hakların hazır',
      body: '5 ücretsiz soru seni bekliyor.',
    },
    {
      title: 'Yeni gün, yeni haklar',
      body: 'İlk soruyu şimdi çek.',
    },
    {
      title: 'Sayaç sıfırlandı',
      body: 'Ücretsiz sorularını kullanmaya hazırsın.',
    },
  ],
  premiumOffer: [
    {
      title: 'Yıllık planda %32 tasarruf',
      body: 'Aya böldüğünde yaklaşık 27 TL; reklamsız, sınırsız çözüm.',
    },
    {
      title: 'Hakların yetmiyor mu?',
      body: "Premium'a geç, istediğin kadar soru çöz.",
    },
    {
      title: 'Bir haftalığına dene',
      body: "Premium'la kesintisiz çalış.",
    },
  ],
  productUpdate: [
    {
      title: 'Yenilikler burada',
      body: 'Konu anlatımları ve istatistikler daha akıcı.',
    },
    {
      title: 'ÇözBil tazelendi',
      body: 'Küçük dokunuşlarla daha rahat kullanım.',
    },
    {
      title: 'Fark yaratan detaylar eklendi',
      body: 'Bir göz at.',
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
