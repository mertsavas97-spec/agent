import { SUBJECT_LABEL, topicsForExam } from '@/src/data';
import type { Topic } from '@/src/data/topics';
import type { ExamType, Subject } from '@/src/lib/api/types';

export type TopicLesson = {
  topicId: string;
  headline: string;
  /** 2–4 short teaching bullets — öğretmen sesi, telifsiz. */
  bullets: string[];
  tip: string;
};

type ExamBrand = {
  short: string;
  voice: string;
  audience: string;
};

function examBrand(exam: ExamType): ExamBrand {
  switch (exam) {
    case 'lgs':
      return {
        short: 'LGS',
        voice: 'ortaokul / 8. sınıf dilinde',
        audience: 'LGS adayı',
      };
    case 'ygs':
      return {
        short: 'YGS/YKS',
        voice: 'lise (TYT–AYT) seviyesinde',
        audience: 'YKS adayı',
      };
    case 'kpss':
      return {
        short: 'KPSS',
        voice: 'GY–GK aday dilinde',
        audience: 'KPSS adayı',
      };
    case 'trafik':
      return {
        short: 'Ehliyet',
        voice: 'ehliyet / MTS adayı dilinde',
        audience: 'ehliyet adayı',
      };
    default: {
      const _e: never = exam;
      return _e;
    }
  }
}

function subjectName(subject: Subject): string {
  if (subject === 'unknown') return 'Konu';
  return SUBJECT_LABEL[subject] ?? subject;
}

/** Hand-authored rich primers — merged on top of catalog lessons. */
const CURATED_LESSONS: TopicLesson[] = [
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
  {
    topicId: 'trafik-traffic-kurallar',
    headline: 'Trafik kuralları — genel çerçeve',
    bullets: [
      'Önce sahneyi kur: yerleşim yeri mi, kavşak mı, tek yön mü?',
      '“Aksi işaret yoksa” genel kuralı uygula; levha varsa levha üstündür.',
      'Geçiş üstünlüğü ve emniyet mesafesi çoğu sorunun anahtarıdır.',
    ],
    tip: 'Ezber etiket değil — “güvenli davranış hangisi?” diye sor.',
  },
  {
    topicId: 'trafik-traffic-hiz-mesafe',
    headline: 'Hız ve takip mesafesi',
    bullets: [
      'Yerleşim yeri azami hız (aksi işaret yoksa) 50 km/s.',
      'Takip mesafesi hız ve yol koşullarına göre artar.',
      'Yağış / görüş düşüklüğünde hızı düşür, mesafeyi aç.',
    ],
    tip: 'Soruda “aksi işaret” var mı diye ilk bak.',
  },
  {
    topicId: 'trafik-traffic-isaretler-uyari',
    headline: 'Uyarı işaretleri',
    bullets: [
      'Üçgen çerçeve = uyarı: tehlikeyi önceden bildirir.',
      'İşaret neyi haber veriyor? Dönüş, yokuş, yaya…',
      'Uyarıyı görünce hızı ayarla; yasakla karıştırma.',
    ],
    tip: 'Şekil + renk ailesini ezberle, sonra içeriği oku.',
  },
  {
    topicId: 'trafik-vehicle-guvenlik',
    headline: 'Araç güvenlik sistemleri',
    bullets: [
      'ABS: kilitlenmeyi önler, yön kontrolünü korur.',
      'ESP / hava yastığı / emniyet kemeri birbirinin yerine geçmez.',
      'Arıza ışığı yanıyorsa ilgili sistemi düşün.',
    ],
    tip: '“Ne işe yarar?” sorusunu sor — şıklar netleşir.',
  },
  {
    topicId: 'trafik-firstaid-temel',
    headline: 'Temel ilk yardım',
    bullets: [
      'Önce kendi güvenliğin, sonra olay yeri güvenliği.',
      'ABC: hava yolu, solunum, dolaşım sırası.',
      'Yapılmaması gerekenleri (su içirmek, zorla kaldırmak) ele.',
    ],
    tip: 'Adımları sırayla yaz; “önce şunu” tuzağına düşme.',
  },
];

function branchBullets(topic: Topic, brand: ExamBrand): string[] {
  const name = topic.nameTr;
  const sub = subjectName(topic.subject);
  const slug = topic.id.split('-').slice(2).join('-');

  switch (topic.subject) {
    case 'turkish':
    case 'literature':
      return [
        `${brand.short} ${sub} · ${name}: ${brand.voice} sorularda şıkları metne götür.`,
        /paragraf/.test(slug)
          ? 'Kökü ayır: ana fikir, yardımcı düşünce, anlatım biçimi, çıkarım.'
          : /anlam|sozcuk|cumlede/.test(slug)
            ? 'Anlam ilgisi: amaç / neden / koşul / karşıtlık bağlarını ayırt et.'
            : /dilbilgisi|sozel/.test(slug)
              ? 'Dil bilgisinde özne–yüklem, yazım ve noktalama kontrolünü sırayla yap.'
              : /siir|nesir/.test(slug)
                ? 'Edebiyatta dönem + tür + temsilci eşlemesini kur.'
                : 'Kökü ayır; metinde dayanağı olmayan şıkkı ele.',
        '“Güzel duruyor” diye seçme — dayanak cümleyi işaret et.',
      ];
    case 'math':
    case 'geometry':
      return [
        `${brand.short} ${sub} · ${name}: ${brand.voice} önce verileri yaz.`,
        /kesir/.test(slug)
          ? 'Kesirde payda eşitle / çarp-böl kurallarını ayır; “kalanın kesri”nde önce kalanı bul.'
          : /yuzde/.test(slug)
            ? 'Yüzde artış ×(1+p/100), azalış ×(1−p/100); ardışık değişimi çarp.'
            : /oran/.test(slug)
              ? 'Doğru / ters orantıyı ayır; birimleri ortak yap.'
              : /denklem|esitsizlik/.test(slug)
                ? 'Bilinmeyeni yalnız bırak; sonucu yerine koyarak doğrula.'
                : 'Ne verildi / ne istendi diye ayır; birimleri kontrol et.',
        'Sonucu şıklara götür; emin değilsen eleme yap.',
      ];
    case 'science':
    case 'physics':
    case 'chemistry':
    case 'biology':
      return [
        `${brand.short} ${sub} · ${name}: kavram + birim + örnek olay üçlüsünü kur.`,
        'Formül ezberi yetmez — hangi büyüklük değişiyor bak.',
        `${brand.audience} için günlük yaşam örneğiyle şıkları test et.`,
      ];
    case 'history':
      return [
        `${brand.short} ${sub} · ${name}: olay → sebep → sonuç zincirini kur.`,
        'Tarih / yer / kişi üçlüsünü metinde doğrula.',
        `${brand.voice} çıkarım sorusunda metnin sınırını aşma.`,
      ];
    case 'geography':
      return [
        `${brand.short} ${sub} · ${name}: konum, iklim, nüfus veya ekonomi hangisi soruluyor ayır.`,
        'Harita / tablo varsa önce onu oku.',
        `${brand.audience} için genellemeyi veriye bağla.`,
      ];
    case 'civics':
    case 'current':
      return [
        `${brand.short} ${sub} · ${name}: kurum / hak / görev kavramını netleştir.`,
        'Anayasa ve temel organları karıştırma.',
        `${brand.voice} güncel soruda tarihi çerçeveyi unutma.`,
      ];
    case 'philosophy':
      return [
        `${brand.short} ${sub} · ${name}: sorunun hangi felsefe alanına ait olduğunu bul.`,
        'Tanım ↔ örnek eşlemesi yap.',
        `${brand.audience} için uç genellemeleri ele.`,
      ];
    case 'religion':
      return [
        `${brand.short} ${sub} · ${name}: inanç / ibadet / ahlak boyutunu ayır.`,
        'Kavramı günlük örnekle bağla.',
        `${brand.voice} metne dayanmayan yorumu seçme.`,
      ];
    case 'english':
      return [
        `${brand.short} ${sub} · ${name}: tense / vocabulary / reading kökünü ayır.`,
        'Özne–fiil uyumuna bak; bağlamdan kelime çıkar.',
        `${brand.audience} için şıkları cümleye geri koy.`,
      ];
    case 'traffic':
      return [
        `${brand.short} · Trafik ve Çevre · ${name}: kuralı işaret / hız / geçiş bağlamında oku.`,
        /hiz|mesafe/.test(slug)
          ? 'Yerleşim yeri 50 km/s (aksi işaret yoksa); takip mesafesini hıza göre aç.'
          : /kavsak/.test(slug)
            ? 'Kontrollü kavşakta ışık/görevli/işaret; dönelde içerideki öncelik.'
            : /uyari/.test(slug)
              ? 'Üçgen = uyarı; tehlikeyi önceden bildirir, hızı ayarla.'
              : /yasak/.test(slug)
                ? 'Daire + kırmızı çerçeve = yasak; yasaklanan eylemi yapma.'
                : /bilgi|cizgi/.test(slug)
                  ? 'Bilgi işaretleri yön/hizmet; düz çizgi aşılmaz, kesik kontrollü geçiş.'
                  : /cevre/.test(slug)
                    ? 'Emisyon, gürültü ve atık yağ — çevre bilinci güvenlikle birlikte sorulur.'
                    : '“Aksi işaret yoksa” genel kural; levha varsa levha üstündür.',
        'Şıkları sahne kurarak ele — ezber etiket seçme.',
      ];
    case 'vehicle':
      return [
        `${brand.short} · Araç Tekniği · ${name}: “sistemin görevi nedir?” diye sor.`,
        /guvenlik/.test(slug)
          ? 'ABS kilitlenmeyi önler; kemer + hava yastığı birbirinin yerine geçmez.'
          : /fren|suspansiyon/.test(slug)
            ? 'Fren hidroliği / balata ve süspansiyon = güvenlik + yol teması.'
            : /elektrik/.test(slug)
              ? 'Akü, far, silecek — arıza belirtisi ↔ bileşen eşlemesi yap.'
              : 'Motor yağı, debriyaj, hararet: belirtiyi parçaya bağla.',
        'Güvenlikle ilgili şıkları önceliklendir.',
      ];
    case 'firstaid':
      return [
        `${brand.short} · İlk Yardım · ${name}: önce kendi güvenliğin, sonra olay yeri, sonra kazazede.`,
        /abc|bilinc/.test(slug)
          ? 'ABC: hava yolu → solunum → dolaşım; bilinç kontrolü ses + hafif uyarı.'
          : /kanama/.test(slug)
            ? 'Dış kanamada temiz baskı; şokta ısı kaybını önle, yardım çağır.'
            : /kirik|yanik/.test(slug)
              ? 'Kırıkta sabitle; yanıkta soğut — macun/un sürme.'
              : 'Yapılmaması gerekeni (su içirmek, zorla taşımak) ele; adımları sırayla yaz.',
        `${brand.audience} için 112’ye konum + durum bildir.`,
      ];
    default:
      return [
        `${brand.short} ${sub} · ${name}: ${brand.voice} sorulur; ezber değil mantık kur.`,
        'Önce neyin verildiğini, sonra neyin istendiğini ayır.',
        'Dayanaklı şıkkı seç; emin değilsen eleme yap.',
      ];
  }
}

/** Catalog lesson — always branded with exam + branch + topic. */
export function buildCatalogLesson(topic: Topic): TopicLesson {
  const brand = examBrand(topic.examType);
  const sub = subjectName(topic.subject);
  return {
    topicId: topic.id,
    headline: `${brand.short} · ${sub} · ${topic.nameTr}`,
    bullets: branchBullets(topic, brand),
    tip: `${brand.short} ${sub} örnek sorusunu çöz; takılırsan fotoğrafla canlı çözüm al.`,
  };
}

function brandRegex(exam: ExamType): RegExp {
  switch (exam) {
    case 'lgs':
      return /\bLGS\b/i;
    case 'ygs':
      return /\bYGS\b|\bYKS\b|\bTYT\b|\bAYT\b/i;
    case 'kpss':
      return /\bKPSS\b/i;
    case 'trafik':
      return /\bEhliyet\b|\behliyet\b|\bMTS\b|\bTrafik\b/i;
    default: {
      const _e: never = exam;
      return _e;
    }
  }
}

/** Ensure curated copy carries exam + branch + topic name. */
function brandCurated(lesson: TopicLesson, topic: Topic): TopicLesson {
  const brand = examBrand(topic.examType);
  const sub = subjectName(topic.subject);
  const blob = `${lesson.headline}\n${lesson.bullets.join('\n')}\n${lesson.tip}`;
  const hasExam = brandRegex(topic.examType).test(blob);
  const headline = `${brand.short} · ${sub} · ${topic.nameTr}`;
  const lead = `${brand.short} ${sub} · ${topic.nameTr}: ${brand.voice} çalış.`;
  const bullets = hasExam
    ? lesson.bullets
    : [lead, ...lesson.bullets].slice(0, 4);
  const tip = brandRegex(topic.examType).test(lesson.tip)
    ? lesson.tip
    : `${brand.short}: ${lesson.tip}`;
  return { topicId: lesson.topicId, headline, bullets, tip };
}

function buildLessonIndex(): Map<string, TopicLesson> {
  const map = new Map<string, TopicLesson>();
  const exams: ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'];
  for (const exam of exams) {
    for (const topic of topicsForExam(exam)) {
      map.set(topic.id, buildCatalogLesson(topic));
    }
  }
  const byId = new Map(
    [...topicsForExam('lgs'), ...topicsForExam('ygs'), ...topicsForExam('kpss'), ...topicsForExam('trafik')].map(
      (t) => [t.id, t] as const,
    ),
  );
  for (const curated of CURATED_LESSONS) {
    const topic = byId.get(curated.topicId);
    if (topic) {
      map.set(curated.topicId, brandCurated(curated, topic));
    } else {
      map.set(curated.topicId, curated);
    }
  }
  return map;
}

const BY_ID = buildLessonIndex();

/** Subject-aware teacher primer when topic-specific copy is missing. */
export function buildFallbackLesson(input: {
  topicId: string;
  nameTr: string;
  subject: Subject;
  examType: ExamType;
}): TopicLesson {
  return buildCatalogLesson({
    id: input.topicId,
    examType: input.examType,
    subject: input.subject,
    nameTr: input.nameTr,
  });
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
  return [...BY_ID.values()];
}
