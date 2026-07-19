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
    topicId: 'kpss-turkish-paragraf',
    headline: 'Paragraf ve anlatım biçimleri',
    bullets: [
      'Öyküleme: olayları zaman içinde anlatır (her sabah, sonra, -di/-mış).',
      'Betimleme: varlık/ortamı duyularla resmeder; açıklama bilgi verir; tartışma savunanır.',
      'Şıkları metne götür — “güzel duruyor” diye değil, dayanakla seç.',
    ],
    tip: 'Anlatım biçimi sorusunda önce eylem/zaman mı, yoksa sıfat/duyu mu baskın bak.',
  },
  {
    topicId: 'kpss-turkish-anlam',
    headline: 'Anlam ilgisi (cümlede anlam)',
    bullets: [
      'Amaç-sonuç: “…mek / …mak için” → amaç; ardından gelen eylem sonuç.',
      'Neden-sonuç: çünkü, -den dolayı, yüzünden → sebep bağlar.',
      'Koşul-sonuç: eğer, -se/-sa; karşıtlık: oysa, fakat, rağmen.',
    ],
    tip: 'Önce bağ sözcüğünü bul (“için”, “çünkü”…), sonra şıklara götür.',
  },
  {
    topicId: 'ygs-turkish-anlam',
    headline: 'Anlam bilgisi / anlam ilgisi',
    bullets: [
      'Amaç-sonuç ile neden-sonuç karışmasın: “yapmak için” çoğunlukla amaçtır.',
      'Şıkları metne götür; ezber etiket seçme.',
      'Uzun cümlede önce fiili, sonra bağı ayır.',
    ],
    tip: '“için” görürsen önce amaç mı sebep mi diye cümleyi sesli oku.',
  },
  {
    topicId: 'lgs-turkish-anlam',
    headline: 'Sözcükte / cümlede anlam',
    bullets: [
      'Anlam ilgisi: amaç, neden, koşul, karşıtlık bağlarını ayırt et.',
      '“…mek için” → amaç-sonuç; “çünkü / -den dolayı” → neden-sonuç.',
      'Şıkkı cümleye geri koyup dene.',
    ],
    tip: 'Bağlacı değiştirince anlam bozuluyorsa doğru ilgiyi bulmuşsundur.',
  },
  {
    topicId: 'ygs-turkish-paragraf',
    headline: 'Paragraf (TYT)',
    bullets: [
      'Ana fikir / konu / anlatım biçimi köklerini ayırt et.',
      'Öyküleme olay, betimleme tasvir, açıklama bilgi, tartışma kanı taşır.',
      'Çıkarım sorularında metnin sınırını aşma.',
    ],
    tip: 'Uzun paragrafta önce soru kökünü oku, sonra metne dön.',
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
    topicId: 'kpss-math-temel-islemler',
    headline: 'Temel işlemler ve kesirler',
    bullets: [
      'İşlem önceliği: parantez → çarpma/bölme → toplama/çıkarma.',
      'Kesirli parantezlerde önce içi bitir, sonra dıştaki çarpanı uygula.',
      'Pay/payda biçimindeki büyük kesirlerde üstü ve altı ayrı hesapla, sonra böl.',
    ],
    tip: 'Şık varsa sonucu şıklara götür — hız kazandırır.',
  },
  {
    topicId: 'kpss-math-kesirler',
    headline: 'Kesir işlemleri (KPSS)',
    bullets: [
      'Toplama/çıkarmada payda eşitle; çarpma pay×pay / payda×payda.',
      'Bileşik kesir: (a/b)÷(c/d) = (a/b)×(d/c).',
      'Parantezli ifadelerde önce içteki kesri sadeleştir.',
    ],
    tip: 'Sonucu en sade hâle getir, sonra şıklarla eşleştir.',
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

function subjectBullets(
  subject: Subject,
  examVoice: string,
  nameTr: string,
): string[] {
  switch (subject) {
    case 'turkish':
    case 'literature':
      return [
        `${nameTr}: ${examVoice} sorularda şıkları metne götür.`,
        'Kökü ayır — ana fikir, anlatım biçimi, anlam ilgisi, dil bilgisi…',
        'Metinde dayanağı olmayan şıkkı eler; “güzel duruyor” diye seçme.',
      ];
    case 'math':
    case 'geometry':
      return [
        `${nameTr}: ${examVoice} işlemde önce verileri yaz.`,
        'Ne verildi / ne istendi diye ayır; birimleri kontrol et.',
        'Sonucu yerine koyarak doğrula; şıkları ele.',
      ];
    case 'science':
    case 'physics':
    case 'chemistry':
    case 'biology':
      return [
        `${nameTr}: kavram + birim + örnek olay üçlüsünü kur.`,
        'Formül ezberi yetmez — hangi büyüklük değişiyor bak.',
        'Şıkları günlük yaşam örneğiyle test et.',
      ];
    case 'history':
      return [
        `${nameTr}: olay → sebep → sonuç zincirini kur.`,
        'Tarih / yer / kişi üçlüsünü metinde doğrula.',
        'Çıkarım sorusunda metnin sınırını aşma.',
      ];
    case 'geography':
      return [
        `${nameTr}: konum, iklim, nüfus veya ekonomi hangisi soruluyor ayır.`,
        'Harita / tablo varsa önce onu oku.',
        'Genellemeyi veriye bağla.',
      ];
    case 'civics':
    case 'current':
      return [
        `${nameTr}: kurum / hak / görev kavramını netleştir.`,
        'Anayasa ve temel organları karıştırma.',
        'Güncel soruda tarihi çerçeveyi unutma.',
      ];
    case 'philosophy':
      return [
        `${nameTr}: sorunun hangi felsefe alanına ait olduğunu bul.`,
        'Tanım ↔ örnek eşlemesi yap.',
        'Şıklardaki uç genellemeleri ele.',
      ];
    case 'religion':
      return [
        `${nameTr}: inanç / ibadet / ahlak boyutunu ayır.`,
        'Kavramı günlük örnekle bağla.',
        'Metne dayanmayan yorumu seçme.',
      ];
    case 'english':
      return [
        `${nameTr}: tense / vocabulary / reading kökünü ayır.`,
        'Özne–fiil uyumuna bak; bağlamdan kelime çıkar.',
        'Şıkları cümleye geri koy.',
      ];
    default:
      return [
        `${nameTr}: ${examVoice} sorulur; ezber değil mantık kur.`,
        'Önce neyin verildiğini, sonra neyin istendiğini ayır.',
        'Dayanaklı şıkkı seç; emin değilsen eleme yap.',
      ];
  }
}

/** Subject-aware teacher primer when topic-specific copy is missing. */
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
    headline: `${input.nameTr} — kısa anlatım`,
    bullets: subjectBullets(input.subject, examVoice, input.nameTr),
    tip: 'Örnek soruyu çöz; takılırsan fotoğrafla canlı çözüm al.',
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
