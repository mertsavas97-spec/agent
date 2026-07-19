import type { ExamType, Subject } from '@/src/lib/api/types';

export type TopicLesson = {
  topicId: string;
  headline: string;
  /** 2–4 short teaching bullets — öğretmen sesi, telifsiz. */
  bullets: string[];
  tip: string;
};

const LESSONS: TopicLesson[] = [
  {
    topicId: 'lgs-math-kesirler',
    headline: 'Kesirler: bütünü parçalara ayırmak',
    bullets: [
      'Pay = alınan parça, payda = bütünün kaç eşit parçaya bölündüğü.',
      'Toplama/çıkarmada paydaları eşitle; çarpma için pay×pay, payda×payda.',
      '“Kalanın yarısı” gibi ifadelerde önce kalanı bul, sonra onun kesrini al.',
    ],
    tip: 'Pastayı çizmek işe yarar — görsel model LGS’de sık kurtarır.',
  },
  {
    topicId: 'lgs-math-uslu-sayilar',
    headline: 'Üslü sayılar',
    bullets: [
      'aⁿ = a’nın n kez çarpımı; üs 0 ise (a≠0) sonuç 1.',
      'Aynı tabanda çarpma: üsleri topla; bölme: üsleri çıkar.',
      'Negatif üs: a⁻ⁿ = 1/aⁿ.',
    ],
    tip: 'Önce tabanları aynı hale getir, sonra üslerle oyna.',
  },
  {
    topicId: 'lgs-math-oran-oranti',
    headline: 'Oran ve orantı',
    bullets: [
      'Oran: iki niceliğin karşılaştırması (a:b veya a/b).',
      'Doğru orantı: biri artınca diğeri de artar; çapraz çarpım.',
      'Ters orantı: biri artınca diğeri azalır (çarpımları sabit).',
    ],
    tip: 'Birimi yaz — km/saat mi, kişi/gün mü net olsun.',
  },
  {
    topicId: 'lgs-math-yuzdeler',
    headline: 'Yüzdeler',
    bullets: [
      '%x = x/100. “%20 artar” → ×1,20; “%20 azalır” → ×0,80.',
      'Ardışık yüzde değişimlerde sırayla çarp; toplam yüzde diye ekleme.',
      '100 üzerinden düşünmek hesapları hızlandırır.',
    ],
    tip: 'Artış + azalış aynı oranda olsa bile net değişim sıfır olmayabilir.',
  },
  {
    topicId: 'lgs-math-denklemler',
    headline: 'Denklemler',
    bullets: [
      'Bilinmeyeni yalnız bırak: her iki tarafa aynı işlemi uygula.',
      'Parantezi aç, benzer terimleri birleştir.',
      'Sonucu yerine koyup kontrol et.',
    ],
    tip: 'İşlem sırasını bozma — önce çarpma/bölme, sonra toplama.',
  },
  {
    topicId: 'lgs-turkish-paragraf',
    headline: 'Paragraf',
    bullets: [
      'Ana düşünce çoğu zaman ilk veya son cümlede gizlidir.',
      'Yardımcı düşünceler ana fikri örnekler / açıklar.',
      '“Çıkarılamaz” sorularında metinde olmayanı ele.',
    ],
    tip: 'Şıkları metne götür — kendi bilginle değil metinle cevapla.',
  },
  {
    topicId: 'ygs-math-denklemler',
    headline: 'Denklemler (YGS/YKS)',
    bullets: [
      'Doğrusal denklem: ax+b=c → x yalnız kalır.',
      'İki tarafı sadeleştir; ortak çarpan varsa böl.',
      'Köklü/üslü denklemlerde tanım kümesini unutma.',
    ],
    tip: 'Şık varsa yerine koyma da geçerli hız taktiğidir.',
  },
  {
    topicId: 'ygs-math-fonksiyonlar',
    headline: 'Fonksiyonlar',
    bullets: [
      'f: A→B her elemana tek görüntü verir.',
      'f(x)=… ifadesinde x yerine verileni yaz.',
      '(f∘g)(x) = f(g(x)) — içten dışa.',
    ],
    tip: 'Tanım kümesi dışındaki x’leri ele.',
  },
  {
    topicId: 'ygs-math-temel-kavramlar',
    headline: 'Temel kavramlar',
    bullets: [
      'Doğal, tam, rasyonel, irrasyonel ayrımını net tut.',
      'İşlem önceliği: parantez → üs → çarpma/bölme → toplama/çıkarma.',
      'Mutlak değer uzaklık demektir: |a| ≥ 0.',
    ],
    tip: 'İşaret hatalarının çoğu öncelik unutulmasından gelir.',
  },
  {
    topicId: 'kpss-math-yuzde',
    headline: 'Yüzde problemleri (KPSS)',
    bullets: [
      'Artış: yeni = eski × (1 + p/100); azalış: × (1 − p/100).',
      'İki ardışık değişimi çarp; yüzde puan ile yüzde değişimi karıştırma.',
      '“Eskisine göre yüzde kaç” sorusunda fark / eski × 100.',
    ],
    tip: '100 TL varsay — KPSS’de klasik hız yöntemi.',
  },
  {
    topicId: 'kpss-math-oran-oranti',
    headline: 'Oran–orantı (KPSS)',
    bullets: [
      'Doğru orantıda a/b = c/d → ad = bc.',
      'İşçi–havuz tipinde ters orantıyı tanı.',
      'Oranları ortak birime indir.',
    ],
    tip: 'Tablo çizmek sözel metni sayısala çevirir.',
  },
  {
    topicId: 'kpss-math-problemler',
    headline: 'Problemler',
    bullets: [
      'Verilenleri ve isteneni ayır; bilinmeyeni tanımla.',
      'Yaş, hız, karışım: birim tutarlılığı şart.',
      'Sonucu şıklara ve sağduyuya göre kontrol et.',
    ],
    tip: 'Önce “ne arıyorum?” cümlesini yaz.',
  },
];

const BY_ID = new Map(LESSONS.map((l) => [l.topicId, l]));

/** Generic teacher-voice primer when topic-specific copy is missing. */
export function buildFallbackLesson(input: {
  topicId: string;
  nameTr: string;
  subject: Subject;
  examType: ExamType;
}): TopicLesson {
  const examVoice =
    input.examType === 'lgs'
      ? 'ortaokul dilinde'
      : input.examType === 'ygs'
        ? 'lise seviyesinde'
        : 'aday dilinde';
  return {
    topicId: input.topicId,
    headline: `${input.nameTr} — kısa hatırlatma`,
    bullets: [
      `Bu konu ${examVoice} sorulur; ezber değil mantık kur.`,
      'Önce neyin verildiğini, sonra neyin istendiğini ayır.',
      'İşlemi adım adım yaz; sonucu yerine koyarak doğrula.',
    ],
    tip: 'Takılırsan “Anlamadım” ile daha sade anlatım iste.',
  };
}

export function lessonForTopic(
  topicId: string | null | undefined,
  fallback?: {
    nameTr: string;
    subject: Subject;
    examType: ExamType;
  },
): TopicLesson | null {
  if (!topicId) return null;
  const known = BY_ID.get(topicId);
  if (known) return known;
  if (fallback) {
    return buildFallbackLesson({ topicId, ...fallback });
  }
  return null;
}

export function allTopicLessons(): TopicLesson[] {
  return LESSONS;
}
