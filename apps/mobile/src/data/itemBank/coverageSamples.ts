import { findTopic, SUBJECT_LABEL, topicsForExam } from '@/src/data';
import type { Topic } from '@/src/data/topics';
import type { ExamType, Subject } from '@/src/lib/api/types';

import type { ItemBankChoiceKey, ItemBankItem } from './types';

/** Minimum original Q&A samples every catalog topic must expose. */
export const MIN_SAMPLES_PER_TOPIC = 3;

const NOTE = 'Özgün mini örnek — telifsiz; sonucu kontrol etmeni öneririz.';

function examTag(exam: ExamType): string {
  switch (exam) {
    case 'lgs':
      return 'LGS';
    case 'ygs':
      return 'YGS/YKS';
    case 'kpss':
      return 'KPSS';
    case 'trafik':
      return 'Trafik (ehliyet/MTS)';
    default: {
      const _e: never = exam;
      return _e;
    }
  }
}

function subjectTag(subject: Subject): string {
  if (subject === 'unknown') return 'Konu';
  return SUBJECT_LABEL[subject] ?? subject;
}

function slugOf(topic: Topic): string {
  // id = exam-subject-slug…
  const parts = topic.id.split('-');
  return parts.slice(2).join('-');
}

function item(
  topic: Topic,
  index: number,
  stem: string,
  choices: ItemBankItem['choices'],
  answerKey: ItemBankChoiceKey,
  steps: ItemBankItem['explanationSteps'],
  difficulty: ItemBankItem['difficulty'] = 'easy',
): ItemBankItem {
  const n = String(index + 1).padStart(3, '0');
  return {
    id: `${topic.id}-demo-${n}`,
    examType: topic.examType,
    subject: topic.subject,
    topicId: topic.id,
    difficulty,
    format: 'multiple_choice',
    stem,
    choices,
    answerKey,
    explanationSteps: steps,
    transparencyNote: NOTE,
  };
}

type Draft = {
  stem: string;
  choices: ItemBankItem['choices'];
  answerKey: ItemBankChoiceKey;
  steps: ItemBankItem['explanationSteps'];
  difficulty?: ItemBankItem['difficulty'];
};

function pack(
  topic: Topic,
  drafts: Draft[],
): ItemBankItem[] {
  return drafts.slice(0, MIN_SAMPLES_PER_TOPIC).map((d, i) =>
    item(topic, i, d.stem, d.choices, d.answerKey, d.steps, d.difficulty ?? 'easy'),
  );
}

function mathDrafts(topic: Topic): Draft[] {
  const exam = examTag(topic.examType);
  const name = topic.nameTr;
  const slug = slugOf(topic);
  const brand = `${exam} · ${subjectTag(topic.subject)} · ${name}`;

  if (/kesir/.test(slug)) {
    return [
      {
        stem: `${brand}: 3/4 + 1/8 işleminin sonucu kaçtır?`,
        choices: { A: '4/8', B: '7/8', C: '1', D: '5/8', E: '3/8' },
        answerKey: 'B',
        steps: [
          { title: '1. Payda', body: 'Paydaları 8 yap: 3/4 = 6/8.' },
          { title: '2. Topla', body: `6/8 + 1/8 = 7/8. ${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Bir pastanın 2/5’i yeniyor. Kalanın 1/2’si yenilirse başlangıçta ne kadarı kalır?`,
        choices: { A: '1/5', B: '2/5', C: '3/10', D: '1/10', E: '3/5' },
        answerKey: 'C',
        steps: [
          { title: '1. Kalan', body: '1 − 2/5 = 3/5.' },
          { title: '2. Son', body: `(3/5)×(1/2)=3/10 yenir; kalan 3/5−3/10=3/10. ${brand}. Cevap C.` },
        ],
        difficulty: 'mid',
      },
      {
        stem: `${brand}: 5/6 sayısının 3 katı kaçtır?`,
        choices: { A: '5/2', B: '15/6', C: '5/18', D: '8/6', E: '15/18' },
        answerKey: 'A',
        steps: [
          { title: '1. Çarp', body: '3 × (5/6) = 15/6 = 5/2.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/yuzde|yuzdeler/.test(slug)) {
    return [
      {
        stem: `${brand}: 80’in %25’i kaçtır?`,
        choices: { A: '15', B: '20', C: '25', D: '30', E: '40' },
        answerKey: 'B',
        steps: [
          { title: '1. Oran', body: '%25 = 1/4.' },
          { title: '2. Hesap', body: `80 × 1/4 = 20. ${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Fiyat 200 TL iken %10 artarsa yeni fiyat kaç TL?`,
        choices: { A: '180', B: '190', C: '210', D: '220', E: '240' },
        answerKey: 'D',
        steps: [
          { title: '1. Artış', body: '200 × 0,10 = 20.' },
          { title: '2. Yeni', body: `200 + 20 = 220. ${brand}. Cevap D.` },
        ],
      },
      {
        stem: `${brand}: Bir sayı %20 azalınca 80 oluyor. İlk sayı kaçtır?`,
        choices: { A: '96', B: '100', C: '104', D: '120', E: '160' },
        answerKey: 'B',
        steps: [
          { title: '1. Oran', body: 'Kalan %80 → 0,8x = 80.' },
          { title: '2. x', body: `x = 100. ${brand}. Cevap B.` },
        ],
        difficulty: 'mid',
      },
    ];
  }

  if (/oran|oranti/.test(slug)) {
    return [
      {
        stem: `${brand}: a/b = 2/5 ve a + b = 28 ise a kaçtır?`,
        choices: { A: '6', B: '8', C: '10', D: '12', E: '14' },
        answerKey: 'B',
        steps: [
          { title: '1. Parça', body: '2+5=7 parça = 28 → 1 parça = 4.' },
          { title: '2. a', body: `a = 8. ${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: 4 işçinin 6 günde bitirdiği işi 8 işçi kaç günde bitirir?`,
        choices: { A: '2', B: '3', C: '4', D: '6', E: '12' },
        answerKey: 'B',
        steps: [
          { title: '1. İş', body: '4×6 = 24 işçi-gün.' },
          { title: '2. Süre', body: `24÷8 = 3 gün. ${brand}. Cevap B.` },
        ],
        difficulty: 'mid',
      },
      {
        stem: `${brand}: 3 : 5 oranı hangi çifte eşittir?`,
        choices: { A: '6:9', B: '9:15', C: '4:5', D: '12:15', E: '5:3' },
        answerKey: 'B',
        steps: [
          { title: '1. Çarp', body: '3×3 : 5×3 = 9:15.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
    ];
  }

  if (/denklem|esitsizlik/.test(slug)) {
    return [
      {
        stem: `${brand}: 2x + 5 = 17 ise x kaçtır?`,
        choices: { A: '4', B: '5', C: '6', D: '7', E: '12' },
        answerKey: 'C',
        steps: [
          { title: '1. Ayır', body: '2x = 12.' },
          { title: '2. Böl', body: `x = 6. ${brand}. Cevap C.` },
        ],
      },
      {
        stem: `${brand}: 3(x − 2) = 12 ise x kaçtır?`,
        choices: { A: '2', B: '4', C: '6', D: '8', E: '10' },
        answerKey: 'C',
        steps: [
          { title: '1. Aç', body: '3x − 6 = 12 → 3x = 18.' },
          { title: '2. x', body: `x = 6. ${brand}. Cevap C.` },
        ],
      },
      {
        stem: `${brand}: x/4 = 3 ise x kaçtır?`,
        choices: { A: '7', B: '9', C: '12', D: '15', E: '16' },
        answerKey: 'C',
        steps: [
          { title: '1. Çarp', body: 'x = 12.' },
          { title: '2. Sonuç', body: `${brand}. Cevap C.` },
        ],
      },
    ];
  }

  // Generic math / geometry pack with exam voice
  return [
    {
      stem: `${brand}: 12’nin %25’i kaçtır?`,
      choices: { A: '2', B: '3', C: '4', D: '6', E: '8' },
      answerKey: 'B',
      steps: [
        { title: '1. Yüzde', body: '%25 = 1/4.' },
        { title: '2. Hesap', body: `12 × 1/4 = 3. ${brand}. Cevap B.` },
      ],
    },
    {
      stem: `${brand}: 15 + 3 × 4 işleminin sonucu kaçtır?`,
      choices: { A: '72', B: '27', C: '48', D: '19', E: '36' },
      answerKey: 'B',
      steps: [
        { title: '1. Öncelik', body: 'Önce çarpma: 3×4 = 12.' },
        { title: '2. Topla', body: `15+12 = 27. ${brand}. Cevap B.` },
      ],
    },
    {
      stem: `${brand}: Bir üçgenin iç açıları toplamı kaç derecedir?`,
      choices: { A: '90', B: '120', C: '180', D: '270', E: '360' },
      answerKey: 'C',
      steps: [
        { title: '1. Kural', body: 'Düzlemde üçgen iç açıları toplamı 180°.' },
        { title: '2. Sonuç', body: `${brand}. Cevap C.` },
      ],
    },
  ];
}

function verbalDrafts(topic: Topic): Draft[] {
  const exam = examTag(topic.examType);
  const name = topic.nameTr;
  const brand = `${exam} · ${subjectTag(topic.subject)} · ${name}`;
  const slug = slugOf(topic);

  if (/paragraf/.test(slug)) {
    return [
      {
        stem: `${brand}: “Yağmur dinince sokaklar doldu.” cümlesinden kesin çıkarılabilecek yargı hangisidir?`,
        choices: {
          A: 'Herkes mutluydu',
          B: 'Yağmur dinmiştir',
          C: 'Okullar tatil oldu',
          D: 'Yaz mevsimidir',
          E: 'Trafik yoğundu',
        },
        answerKey: 'B',
        steps: [
          { title: '1. Metin', body: 'Yalnızca yağmurun dindiği açıkça söylenir.' },
          { title: '2. Eleme', body: `Diğer şıklar metni aşıyor. ${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Paragrafta ana düşünceyi bulurken önce neye bakılır?`,
        choices: {
          A: 'Yazarın ünvanına',
          B: 'Metnin bütününe ve tekrarlanan yargıya',
          C: 'Sadece ilk cümleye',
          D: 'Sadece son kelimeye',
          E: 'Şıkların uzunluğuna',
        },
        answerKey: 'B',
        steps: [
          { title: '1. Strateji', body: 'Ana düşünce metnin omurgasıdır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Yardımcı düşünce ana düşünceyle nasıl ilişkilidir?`,
        choices: {
          A: 'Onu çürütür',
          B: 'Onu destekler / örnekler',
          C: 'Konuyu değiştirir',
          D: 'Bağımsızdır',
          E: 'Her zaman zıttır',
        },
        answerKey: 'B',
        steps: [
          { title: '1. Tanım', body: 'Yardımcı düşünceler ana yargıyı besler.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
    ];
  }

  if (/anlam|sozcuk|cumlede/.test(slug)) {
    return [
      {
        stem: `${brand}: “Bu açıklama konuyu aydınlattı.” cümlesinde “aydınlattı”ya en yakın anlam hangisidir?`,
        choices: {
          A: 'Işık verdi',
          B: 'Daha anlaşılır kıldı',
          C: 'Karanlık yaptı',
          D: 'Erteledi',
          E: 'Unutturdu',
        },
        answerKey: 'B',
        steps: [
          { title: '1. Bağlam', body: 'Açıklama sonrası anlaşılırlık artmış.' },
          { title: '2. Seçim', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: “Sabah erken kalktı çünkü sınava yetişecekti.” anlam ilgisi hangisine yakındır?`,
        choices: {
          A: 'Amaç-sonuç / neden',
          B: 'Karşıtlık',
          C: 'Benzerlik',
          D: 'Ünlem',
          E: 'Koşul değilse',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Bağ', body: '“çünkü” neden bildirir; amaç da yakın alandır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Eş anlamlıyı bulurken en güvenli yol hangisidir?`,
        choices: {
          A: 'Şıklardan en uzununu seçmek',
          B: 'Kelimeyi cümle bağlamına geri koymak',
          C: 'Ezber listeden rastgele seçmek',
          D: 'Kökü okumamak',
          E: 'Noktalamaya bakmamak',
        },
        answerKey: 'B',
        steps: [
          { title: '1. Yöntem', body: 'Bağlam anlamı belirler.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
    ];
  }

  if (/dilbilgisi|sozel-mantik/.test(slug)) {
    return [
      {
        stem: `${brand}: “Kitabı okudu.” cümlesinde yüklem hangisidir?`,
        choices: { A: 'Kitabı', B: 'okudu', C: 'cümle', D: 'nokta', E: 'özne yok' },
        answerKey: 'B',
        steps: [
          { title: '1. Tanım', body: 'Yüklem işi bildiren ögedir: okudu.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Özne–yüklem uyumu için doğru yaklaşım hangisidir?`,
        choices: {
          A: 'Şahıs ve sayı uyumuna bakmak',
          B: 'Sadece noktalama saymak',
          C: 'Kelime uzunluğuna bakmak',
          D: 'Şıkları ezberlemek',
          E: 'Metni atlamak',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Kural', body: 'Özne ile yüklem şahıs/sayıda uyumlu olmalı.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Yazım yanlışı ararken önce nereye bakılır?`,
        choices: {
          A: 'Büyük harf, birleşik/ayrı yazım, ekler',
          B: 'Sadece paragraf uzunluğu',
          C: 'Sadece şık rengi',
          D: 'Soru numarası',
          E: 'Sayfa kenarı',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Kontrol', body: 'Yazım kuralları ek ve birleşik yazımı kapsar.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/siir|nesir|literature/.test(slug) || topic.subject === 'literature') {
    return [
      {
        stem: `${brand}: Şiirde “vezin” neyi ifade eder?`,
        choices: {
          A: 'Ölçü / ritmi',
          B: 'Yalnızca noktalamayı',
          C: 'Yazarın doğum yerini',
          D: 'Sayfa numarasını',
          E: 'Yayınevini',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Tanım', body: 'Vezin, şiirin ölçü düzenidir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Edebiyat tarihinde dönemleri ayırırken neye bakılır?`,
        choices: {
          A: 'Dönem özellikleri ve temsilcilere',
          B: 'Sadece kitap fiyatına',
          C: 'Kapak rengine',
          D: 'Sayfa kalınlığına',
          E: 'Fonta',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Yöntem', body: 'Dönem + sanatçı eşlemesi AYT edebiyatın omurgasıdır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Nesir hangi türü kapsar?`,
        choices: {
          A: 'Düz yazı türlerini',
          B: 'Yalnızca manzumeyi',
          C: 'Yalnızca tiyatroyu',
          D: 'Yalnızca şarkıyı',
          E: 'Hiçbirini',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Tanım', body: 'Nesir = düz yazı.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  // default verbal
  return [
    {
      stem: `${brand}: “Sabah erken kalktı çünkü sınava yetişecekti.” Bu cümlede anlam ilgisi hangisine yakındır?`,
      choices: {
        A: 'Amaç-sonuç',
        B: 'Karşıtlık',
        C: 'Benzerlik',
        D: 'Koşul-sonuç',
        E: 'Ünlem',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Bağ', body: '“çünkü” neden/amaç bağını işaret eder.' },
        { title: '2. Seçim', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Metne dayanmayan şık için doğru tutum hangisidir?`,
      choices: {
        A: 'Elemek',
        B: 'Seçmek',
        C: 'Ezberlemek',
        D: 'Atlamak',
        E: 'Uydurmak',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Kural', body: 'Dayanağı olmayan şık elenir.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Soru kökünü okumadan şık seçmek neden yanlıştır?`,
      choices: {
        A: 'Kök, istenen bilgiyi belirler',
        B: 'Zaman kazandırır',
        C: 'Her zaman doğrudur',
        D: 'Şıkları kısaltır',
        E: 'Noktalamayı siler',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Strateji', body: `${exam} sözelde kök her şeydir.` },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
  ];
}

function scienceDrafts(topic: Topic): Draft[] {
  const exam = examTag(topic.examType);
  const name = topic.nameTr;
  const brand = `${exam} · ${subjectTag(topic.subject)} · ${name}`;
  const slug = slugOf(topic);

  if (/basinc/.test(slug)) {
    return [
      {
        stem: `${brand}: Sıvı basıncı derinleştikçe nasıl değişir?`,
        choices: { A: 'Azalır', B: 'Artar', C: 'Değişmez', D: 'Sıfır olur', E: 'Negatif olur' },
        answerKey: 'B',
        steps: [
          { title: '1. İlişki', body: 'P = h·d·g → derinlik artınca basınç artar.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Atmosfer basıncı hangi araçla ölçülür?`,
        choices: { A: 'Termometre', B: 'Barometre', C: 'Ampermetre', D: 'Voltmetre', E: 'Mikrometre' },
        answerKey: 'B',
        steps: [
          { title: '1. Araç', body: 'Barometre atmosfer basıncını ölçer.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Katı basıncı formülü hangisidir?`,
        choices: { A: 'P = F/A', B: 'P = m·a', C: 'P = V·I', D: 'P = m/V', E: 'P = F·d' },
        answerKey: 'A',
        steps: [
          { title: '1. Formül', body: 'Katı basıncı kuvvet / yüzey alanı.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/elektrik/.test(slug)) {
    return [
      {
        stem: `${brand}: Ohm yasasında V = ?`,
        choices: { A: 'I/R', B: 'I·R', C: 'I+R', D: 'R/I', E: 'I−R' },
        answerKey: 'B',
        steps: [
          { title: '1. Yasa', body: 'V = I·R.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Seri bağlı dirençlerde toplam direnç nasıl bulunur?`,
        choices: { A: 'Çarpılır', B: 'Toplanır', C: 'Çıkarılır', D: 'Bölünür', E: 'Karekök alınır' },
        answerKey: 'B',
        steps: [
          { title: '1. Kural', body: 'Seride R_top = R1 + R2 + …' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Akım birimi hangisidir?`,
        choices: { A: 'Volt', B: 'Ohm', C: 'Amper', D: 'Watt', E: 'Joule' },
        answerKey: 'C',
        steps: [
          { title: '1. Birim', body: 'Akım amper (A) ile ölçülür.' },
          { title: '2. Sonuç', body: `${brand}. Cevap C.` },
        ],
      },
    ];
  }

  if (/hucre|dna|genetik/.test(slug)) {
    return [
      {
        stem: `${brand}: Hücrenin genetik maddesi nerede yoğunlaşır (ökaryot)?`,
        choices: { A: 'Mitokondri', B: 'Çekirdek', C: 'Golgi', D: 'Lizozom', E: 'Sitoplazma duvarı' },
        answerKey: 'B',
        steps: [
          { title: '1. Bilgi', body: 'DNA çoğunlukla çekirdektedir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Fotosentez hangi organelde gerçekleşir?`,
        choices: { A: 'Mitokondri', B: 'Kloroplast', C: 'Ribozom', D: 'Vakuol', E: 'Sentrozom' },
        answerKey: 'B',
        steps: [
          { title: '1. Organel', body: 'Kloroplast fotosentez yeridir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: DNA’nın açılımı nedir?`,
        choices: {
          A: 'Deoksiribonükleik asit',
          B: 'Dirençli nükleer asit',
          C: 'Dinamik nöron asidi',
          D: 'Dış nükleer ağ',
          E: 'Düz nötral asit',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Terim', body: 'DNA = deoksiribonükleik asit.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/atom|asit|tepkim|kimyasal/.test(slug) || topic.subject === 'chemistry') {
    return [
      {
        stem: `${brand}: Atomun pozitif yüklü parçacığı hangisidir?`,
        choices: { A: 'Elektron', B: 'Proton', C: 'Nötron', D: 'Foton', E: 'Pozitron değil proton' },
        answerKey: 'B',
        steps: [
          { title: '1. Tanım', body: 'Proton (+), elektron (−), nötron (0).' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: pH < 7 olan çözelti nasıl adlandırılır?`,
        choices: { A: 'Bazik', B: 'Asidik', C: 'Nötr', D: 'Tuzsuz', E: 'Gaz' },
        answerKey: 'B',
        steps: [
          { title: '1. Ölçek', body: 'pH < 7 asidiktir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Yanma tepkimesinde genelde hangi gaz gereklidir?`,
        choices: { A: 'Azot', B: 'Oksijen', C: 'Helyum', D: 'Neon', E: 'Argon' },
        answerKey: 'B',
        steps: [
          { title: '1. Koşul', body: 'Yanma için oksijen gerekir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
    ];
  }

  if (/hareket|kuvvet|enerji/.test(slug) || topic.subject === 'physics') {
    return [
      {
        stem: `${brand}: Hız birimi SI’de hangisidir?`,
        choices: { A: 'm/s', B: 'N', C: 'J', D: 'W', E: 'Pa' },
        answerKey: 'A',
        steps: [
          { title: '1. Birim', body: 'Hız = yol/zaman → m/s.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Newton’un 2. yasası hangisidir?`,
        choices: { A: 'F = m·a', B: 'E = m·c²', C: 'P = F/A', D: 'V = I·R', E: 'W = F·d değil mi — F=ma' },
        answerKey: 'A',
        steps: [
          { title: '1. Yasa', body: 'F = m·a.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Potansiyel enerji hangi ifadeyle artar?`,
        choices: {
          A: 'Yükseklik artınca',
          B: 'Sıcaklık düşünce her zaman',
          C: 'Renk değişince',
          D: 'Ses yükselince',
          E: 'Kütle sıfırken',
        },
        answerKey: 'A',
        steps: [
          { title: '1. İlişki', body: 'Ep = m·g·h → h artınca Ep artar.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  return [
    {
      stem: `${brand}: Suyun kaynama noktası standart basınçta yaklaşık kaç °C’dir?`,
      choices: { A: '0', B: '50', C: '100', D: '150', E: '200' },
      answerKey: 'C',
      steps: [
        { title: '1. Bilinen', body: 'Standart basınçta su ~100 °C’de kaynar.' },
        { title: '2. Bağla', body: `${brand}. Cevap C.` },
      ],
    },
    {
      stem: `${brand}: Madde halleri arasında hangisi doğru sıralamadır?`,
      choices: {
        A: 'Katı → sıvı → gaz (ısı alınca genelde)',
        B: 'Gaz → katı → sıvı her zaman',
        C: 'Sıvı → plazma → katı',
        D: 'Yalnızca katı vardır',
        E: 'Hal diye bir şey yoktur',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Hal', body: 'Isı ile katı→sıvı→gaz geçişi tipiktir.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Enerji korunumu neyi söyler?`,
      choices: {
        A: 'Enerji yoktan var / vardan yok olmaz; dönüşür',
        B: 'Enerji hep artar',
        C: 'Enerji hep azalır',
        D: 'Enerji yalnızca ışıktır',
        E: 'Enerji ölçüleméz',
      },
      answerKey: 'A',
      steps: [
        { title: '1. İlke', body: 'Korunum: biçim değişir, toplam korunur.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
  ];
}

function historyDrafts(topic: Topic): Draft[] {
  const exam = examTag(topic.examType);
  const brand = `${exam} · ${subjectTag(topic.subject)} · ${topic.nameTr}`;
  return [
    {
      stem: `${brand}: TBMM’nin açılış yılı hangisidir?`,
      choices: { A: '1919', B: '1920', C: '1923', D: '1938', E: '1945' },
      answerKey: 'B',
      steps: [
        { title: '1. Tarih', body: 'TBMM 23 Nisan 1920’de açılmıştır.' },
        { title: '2. Bağlam', body: `${brand}. Cevap B.` },
      ],
    },
    {
      stem: `${brand}: Cumhuriyet’in ilan yılı hangisidir?`,
      choices: { A: '1919', B: '1920', C: '1923', D: '1938', E: '1950' },
      answerKey: 'C',
      steps: [
        { title: '1. Tarih', body: '29 Ekim 1923.' },
        { title: '2. Sonuç', body: `${brand}. Cevap C.` },
      ],
    },
    {
      stem: `${brand}: Olay–sebep–sonuç zincirinde doğru sıra hangisidir?`,
      choices: {
        A: 'Önce sebep ve bağlam, sonra olay, sonra sonuç',
        B: 'Sadece ezber tarih',
        C: 'Sonuçsuz olay',
        D: 'Rastgele sıra',
        E: 'Yalnızca kişi adı',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Yöntem', body: `${exam} tarihinde zincir kurulur.` },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
  ];
}

function geographyDrafts(topic: Topic): Draft[] {
  const exam = examTag(topic.examType);
  const brand = `${exam} · ${subjectTag(topic.subject)} · ${topic.nameTr}`;
  return [
    {
      stem: `${brand}: Türkiye’nin başkenti hangi ildir?`,
      choices: { A: 'İstanbul', B: 'İzmir', C: 'Ankara', D: 'Bursa', E: 'Antalya' },
      answerKey: 'C',
      steps: [
        { title: '1. Bilgi', body: 'Başkent Ankara’dır.' },
        { title: '2. Not', body: `${brand}. Cevap C.` },
      ],
    },
    {
      stem: `${brand}: Türkiye’yi çevreleyen denizlerden biri hangisidir?`,
      choices: { A: 'Karadeniz', B: 'Baltık', C: 'Kızıldeniz (sınır)', D: 'Hazar (iç)', E: 'Aral' },
      answerKey: 'A',
      steps: [
        { title: '1. Konum', body: 'Karadeniz Türkiye’nin kuzeyindedir.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Nüfus yoğunluğu nasıl hesaplanır?`,
      choices: {
        A: 'Nüfus ÷ alan',
        B: 'Alan ÷ nüfus',
        C: 'Nüfus × alan',
        D: 'Sadece doğum oranı',
        E: 'Sadece göç',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Formül', body: 'Yoğunluk = nüfus / yüzey alanı.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
  ];
}

function trafikTrafficDrafts(topic: Topic): Draft[] {
  const brand = `${examTag(topic.examType)} · ${subjectTag(topic.subject)} · ${topic.nameTr}`;
  const slug = slugOf(topic);

  if (/hiz|mesafe/.test(slug)) {
    return [
      {
        stem: `${brand}: Yerleşim yerinde aksi işaret yoksa azami hız genelde kaç km/s’dir?`,
        choices: { A: '30', B: '50', C: '70', D: '90', E: '120' },
        answerKey: 'B',
        steps: [
          { title: '1. Kural', body: 'Yerleşim yeri genel azami hız çoğu durumda 50 km/s.' },
          { title: '2. Bağla', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Takip mesafesi hız arttıkça nasıl değişmelidir?`,
        choices: { A: 'Kısalmalı', B: 'Artmalı', C: 'Sıfır olmalı', D: 'Önemsiz', E: 'Sabit kalmalı her zaman' },
        answerKey: 'B',
        steps: [
          { title: '1. Güvenlik', body: 'Hız arttıkça fren mesafesi uzar → takip mesafesi artar.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Yağışlı havada hız için doğru yaklaşım hangisidir?`,
        choices: {
          A: 'Hızı düşürmek',
          B: 'Hızı artırmak',
          C: 'Takip mesafesini kapatmak',
          D: 'Farları kapatmak',
          E: 'Emniyet kemerini çıkarmak',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Koşul', body: 'Görüş ve tutunma azalır → hız düşürülür.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/kavsak/.test(slug)) {
    return [
      {
        stem: `${brand}: Kontrollü kavşakta geçiş üstünlüğü öncelikle kime aittir?`,
        choices: {
          A: 'Işık / görevli / işaret düzenine uyanlara',
          B: 'En hızlı araca',
          C: 'En büyük araca',
          D: 'Korna çalana',
          E: 'Sollayana',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Kural', body: 'Kontrollü kavşakta düzenleyici unsur üstündür.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Dönel kavşakta genel kural hangisidir?`,
        choices: {
          A: 'Dönel içindeki araçların geçiş üstünlüğü vardır',
          B: 'Giren her zaman üstündür',
          C: 'Kural yoktur',
          D: 'Sadece kamyonlar geçer',
          E: 'Geri geri girilir',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Kural', body: 'Dönel içindeki trafik önceliklidir (genel kural).' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Kavşakta sola dönerken dikkat edilmesi gereken hangisidir?`,
        choices: {
          A: 'Karşıdan gelen ve yayalar',
          B: 'Sadece radyo',
          C: 'Sadece hız göstergesi',
          D: 'Park sensörü yoksa dönülmez',
          E: 'Hiçbir şey',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Güvenlik', body: 'Sola dönüşte karşı trafik ve yaya kontrolü şarttır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/isaretler-uyari|uyari/.test(slug)) {
    return [
      {
        stem: `${brand}: Üçgen çerçeveli işaretler genelde neyi bildirir?`,
        choices: { A: 'Uyarı', B: 'Yasak', C: 'Bilgi', D: 'Otoyol ücreti', E: 'Park yeri fiyatı' },
        answerKey: 'A',
        steps: [
          { title: '1. Aile', body: 'Üçgen = uyarı ailesi.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Uyarı işaretini görünce ilk yapılması gereken nedir?`,
        choices: {
          A: 'Hızı ve dikkati ayarlamak',
          B: 'Hızı artırmak',
          C: 'İşareti yok saymak',
          D: 'Korna çalmak',
          E: 'Şerit değiştirmeden devam',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Davranış', body: 'Uyarı, tehlikeyi önceden bildirir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Uyarı ile yasak işaretini ayıran temel fark nedir?`,
        choices: {
          A: 'Uyarı tehlikeyi bildirir; yasak davranışı engeller',
          B: 'İkisi aynıdır',
          C: 'Uyarı hep kırmızıdır',
          D: 'Yasak hep üçgendir',
          E: 'Fark yoktur',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Ayrım', body: 'Şekil/renk ailesi + anlam farklıdır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/yasak/.test(slug)) {
    return [
      {
        stem: `${brand}: Daire içinde kırmızı çerçeve + çapraz genelde neyi gösterir?`,
        choices: { A: 'Yasaklama', B: 'Uyarı', C: 'Turist bilgisi', D: 'Otopark ücreti', E: 'Yol çalışması değil yasak' },
        answerKey: 'A',
        steps: [
          { title: '1. Aile', body: 'Yasaklama işaretleri daire + kırmızı çerçeve ailesindedir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: “Giriş yok” işaretine uyulmazsa ne olur?`,
        choices: {
          A: 'Kural ihlali / tehlike oluşur',
          B: 'Ödül alınır',
          C: 'Hız artar güvenle',
          D: 'İşaret geçersizdir',
          E: 'Sadece gece geçerlidir',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Sonuç', body: 'Yasak işaretleri bağlayıcıdır.' },
          { title: '2. Bağla', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Yasak işaretini görünce doğru davranış hangisidir?`,
        choices: {
          A: 'İşaretin yasakladığı eylemi yapmamak',
          B: 'Hızlanmak',
          C: 'İşareti kapatmak',
          D: 'Sollamak zorunlu',
          E: 'Park etmek zorunlu',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Davranış', body: 'Yasak = yapılmaması gereken.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/bilgi|cizgi/.test(slug)) {
    return [
      {
        stem: `${brand}: Mavi zeminli dikdörtgen işaretler genelde neyi bildirir?`,
        choices: { A: 'Bilgi / yön', B: 'Yasak', C: 'Tehlike uyarısı', D: 'Ceza tutarı', E: 'Lastik basıncı' },
        answerKey: 'A',
        steps: [
          { title: '1. Aile', body: 'Bilgi işaretleri yön ve hizmet bilgisidir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Kesik yol çizgisi genelde neye izin verir?`,
        choices: {
          A: 'Uygunsa şerit değiştirmeye',
          B: 'Hiçbir manevraya',
          C: 'Geri gitmeye zorunlu',
          D: 'Park etmeye her yerde',
          E: 'Hız sınırı yok demektir',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Çizgi', body: 'Kesik çizgi kontrollü şerit değişimine olanak tanır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Sürekli (düz) çizgiyi ihlal etmek ne anlama gelir?`,
        choices: {
          A: 'Şerit ihlali / tehlikeli manevra',
          B: 'Önerilen davranıştır',
          C: 'Sadece gündüz serbest',
          D: 'Sadece kamyona serbest',
          E: 'Çizgi yok sayılır',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Kural', body: 'Düz çizgi aşılamaz (genel).' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/cevre/.test(slug)) {
    return [
      {
        stem: `${brand}: Egzoz emisyonunu azaltmak için doğru davranış hangisidir?`,
        choices: {
          A: 'Araç bakımını yaptırmak / gereksiz rölantiden kaçınmak',
          B: 'Filtresiz egzoz takmak',
          C: 'Lastiği aşırı şişirmek bilinçsizce',
          D: 'Çöpleri yola atmak',
          E: 'Korna ile uyarmak sürekli',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Çevre', body: 'Bakım ve bilinçli kullanım emisyonu düşürür.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Gürültü kirliliği için hangisi doğrudur?`,
        choices: {
          A: 'Gereksiz korna / egzoz sesinden kaçınmak',
          B: 'Sürekli korna çalmak',
          C: 'Müzik sesini maksimuma almak',
          D: 'Susturucuyu sökmek',
          E: 'Gece hız denemesi yapmak',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Kural', body: 'Gürültüyü azaltmak çevre bilincinin parçasıdır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Araçtan çıkan atık yağ nereye verilmelidir?`,
        choices: {
          A: 'Yetkili toplama / bakım noktasına',
          B: 'Dereye',
          C: 'Toprağa',
          D: 'Çöp konteynerine gelişigüzel',
          E: 'Yağmur suyu ızgarasına',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Çevre', body: 'Atık yağ özel toplanır; doğaya dökülmez.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  // kurallar / default traffic
  return [
    {
      stem: `${brand}: Emniyet kemeri ne zaman takılmalıdır?`,
      choices: {
        A: 'Araç hareket etmeden önce',
        B: 'Sadece otoyolda',
        C: 'Sadece yağmurda',
        D: 'Sadece arka koltukta',
        E: 'Hiçbir zaman zorunlu değil',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Kural', body: 'Kemer, hareket öncesi takılır.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: “Aksi işaret yoksa” ifadesi ne anlama gelir?`,
      choices: {
        A: 'Genel kural geçerlidir; levha varsa levha üstündür',
        B: 'Kural yoktur',
        C: 'Her zaman 120 km/s',
        D: 'Sadece gece geçerlidir',
        E: 'İşaret yok sayılır',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Yorum', body: 'Genel kural + istisna levhası mantığı.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Yayaya geçitte doğru davranış hangisidir?`,
      choices: {
        A: 'Yavaşlamak / öncelik vermek',
        B: 'Hızlanmak',
        C: 'Korna ile korkutmak',
        D: 'Sollamak',
        E: 'Far yakıp geçmek',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Güvenlik', body: 'Yaya geçidi önceliği güvenlik içindir.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
  ];
}

function trafikVehicleDrafts(topic: Topic): Draft[] {
  const brand = `${examTag(topic.examType)} · ${subjectTag(topic.subject)} · ${topic.nameTr}`;
  const slug = slugOf(topic);

  if (/guvenlik|abs|esp/.test(slug) || /güvenlik/i.test(topic.nameTr)) {
    return [
      {
        stem: `${brand}: ABS’nin temel amacı nedir?`,
        choices: {
          A: 'Yakıtı artırmak',
          B: 'Frenlemede tekerlek kilitlenmesini önlemek',
          C: 'Klimayı açmak',
          D: 'Camı indirmek',
          E: 'Radyoyu kapatmak',
        },
        answerKey: 'B',
        steps: [
          { title: '1. Kavram', body: 'ABS kilitlenmeyi önleyerek yön kontrolünü korur.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Emniyet kemeri ile hava yastığı ilişkisi nasıldır?`,
        choices: {
          A: 'Birbirini tamamlar; kemer şarttır',
          B: 'Kemer gereksizdir',
          C: 'Hava yastığı kemerin yerine geçer',
          D: 'İkisi de otoyolda kapalı olmalı',
          E: 'Sadece arkada gerekir',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Güvenlik', body: 'Hava yastığı kemerin yerine geçmez.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: ESP / denge sistemi neye yardımcı olur?`,
        choices: {
          A: 'Kayma / savrulmayı azaltmaya',
          B: 'Yakıtı boşa harcamaya',
          C: 'Farları söndürmeye',
          D: 'Koltuk ısıtmaya',
          E: 'Cam buğusuna',
        },
        answerKey: 'A',
        steps: [
          { title: '1. İşlev', body: 'ESP araç dengesini korumaya yardımcı olur.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/fren|suspansiyon/.test(slug)) {
    return [
      {
        stem: `${brand}: Fren hidroliği eksikse olası sonuç nedir?`,
        choices: {
          A: 'Fren performansı düşebilir',
          B: 'Hız artar güvenle',
          C: 'Yakıt biter',
          D: 'Cam kırılır',
          E: 'Klima soğutmaz yalnızca',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Sistem', body: 'Hidrolik fren basıncı sıvıya bağlıdır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Süspansiyonun temel görevi nedir?`,
        choices: {
          A: 'Konfor ve tekerlek–yol temasını korumak',
          B: 'Far yakmak',
          C: 'Cam sileceği çalıştırmak',
          D: 'Klimayı soğutmak',
          E: 'Radyo frekansı ayarlamak',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Görev', body: 'Süspansiyon salınımı sönümler, teması korur.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Fren balatası aşınırsa ne yapılmalıdır?`,
        choices: {
          A: 'Değiştirilmeli / bakım',
          B: 'Yok sayılmalı',
          C: 'Su dökülmeli',
          D: 'Lastik indirilmeli',
          E: 'Akü sökülmeli',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Bakım', body: 'Aşınmış balata güvenlik riskidir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/elektrik|aydinlatma/.test(slug)) {
    return [
      {
        stem: `${brand}: Akü voltajı düşükse olası belirti hangisidir?`,
        choices: {
          A: 'Marş zorlanır / farlar zayıflar',
          B: 'Yakıt artar her zaman',
          C: 'Lastik şişer',
          D: 'Cam buğulanmaz',
          E: 'ABS devre dışı kalmak zorunda değil ama belirti A',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Elektrik', body: 'Düşük akü elektrik sistemini zayıflatır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Kısa far ne işe yarar?`,
        choices: {
          A: 'Yakın alanı aydınlatır, karşıyı fazla rahatsız etmez',
          B: 'Sadece sis lambasıdır',
          C: 'Freni güçlendirir',
          D: 'ABS’yi açar',
          E: 'Yakıt enjekte eder',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Aydınlatma', body: 'Kısa far gece/ gündüz yakın görüş içindir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Silecek suyu bittiğinde doğru davranış hangisidir?`,
        choices: {
          A: 'Uygun cam suyunu tamamlamak',
          B: 'Asit dökmek',
          C: 'Yağ dökmek',
          D: 'Hiçbir şey yapmamak zorunlu',
          E: 'Far camını ovmak elle sürerken',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Bakım', body: 'Cam suyu görüş güvenliği içindir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  // motor default
  return [
    {
      stem: `${brand}: Motor yağ seviyesi düşükse olası risk nedir?`,
      choices: {
        A: 'Motor hasarı / aşırı ısınma riski',
        B: 'Hız artışı güvenli',
        C: 'Yakıt bitmez',
        D: 'Cam kırılır',
        E: 'Lastik iner',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Yağ', body: 'Yağ yağlama ve soğutmaya yardımcı olur.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Debriyaj hangi aktarma elemanıdır (manuel)?`,
      choices: {
        A: 'Motor ile şanzıman arasında güç aktarımını ayırır/ bağlar',
        B: 'Sadece far anahtarıdır',
        C: 'Sadece silecek koludur',
        D: 'Klima gazıdır',
        E: 'Egzoz filtresidir',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Görev', body: 'Debriyaj güç aktarımını kontrol eder.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Motor hararet yaptığında doğru ilk yaklaşım hangisidir?`,
      choices: {
        A: 'Güvenli yerde durup soğumasını beklemek / kontrol',
        B: 'Hemen kapak açıp su dökmek',
        C: 'Gaza basmak',
        D: 'Klimayı maksimuma almak bilinçsizce',
        E: 'Yağ doldurmadan devam',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Güvenlik', body: 'Hararette önce güvenli duruş ve soğuma.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
  ];
}

function firstaidDrafts(topic: Topic): Draft[] {
  const brand = `${examTag(topic.examType)} · ${subjectTag(topic.subject)} · ${topic.nameTr}`;
  const slug = slugOf(topic);

  if (/kanama|sok|şok/.test(slug) || /Kanama|Şok/.test(topic.nameTr)) {
    return [
      {
        stem: `${brand}: Dış kanamada ilk müdahale hangisidir?`,
        choices: {
          A: 'Temiz bezle baskı uygulamak',
          B: 'Yara içine toprak doldurmak',
          C: 'Su içirmek zorunlu',
          D: 'Hemen taşımak her koşulda',
          E: 'Turnike her küçük kesikte',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Baskı', body: 'Doğrudan baskı kanamayı kontrol eder.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Şok belirtilerinde doğru yaklaşım hangisidir?`,
        choices: {
          A: 'Üstü örtülür, ayaklar hafif yükseltilir (uygunsa), yardım çağrılır',
          B: 'Koşmaya zorlanır',
          C: 'Bol su içirilir bilinç kapalıyken',
          D: 'Ayağa kaldırılır zorunlu',
          E: 'İlaç zorla yutturulur',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Şok', body: 'Isı kaybını önle, pozisyon ver, yardım çağır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Kanayan bölgeye ne yapılmamalıdır?`,
        choices: {
          A: 'Kirli bez / toprak sürmek',
          B: 'Temiz baskı',
          C: 'Eldiven varsa kullanmak',
          D: 'Yardım istemek',
          E: 'Sakin kalmak',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Yapma', body: 'Enfeksiyon riski olan müdahalelerden kaçın.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/kirik|yanik/.test(slug)) {
    return [
      {
        stem: `${brand}: Şüpheli kırıkta doğru yaklaşım hangisidir?`,
        choices: {
          A: 'Hareket ettirmeden sabitlemek / yardım',
          B: 'Zorla düzeltmek',
          C: 'Koşturmak',
          D: 'Masaj yapmak zorunlu',
          E: 'Sıcak su dökmek',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Sabitle', body: 'Kırık şüphesinde gereksiz hareket zarar verir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Yanıkta ilk yapılması gereken genelde nedir?`,
        choices: {
          A: 'Soğuk su ile soğutmak (uygun süre)',
          B: 'Diş macunu sürmek',
          C: 'Buz doğrudan uzun süre',
          D: 'Kabuğu patlatmak',
          E: 'Un serpmek',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Soğut', body: 'Yanıkta soğutma doku hasarını azaltır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Kırıkta turnike ne zaman düşünülür?`,
        choices: {
          A: 'Hayatı tehdit eden kontrol edilemeyen kanamada (bilgi dahilinde)',
          B: 'Her morlukta',
          C: 'Her zaman ilk adım',
          D: 'Sadece baş ağrısında',
          E: 'Hiçbir zaman hiçbir kaynakta yok',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Uyarı', body: 'Turnike istisnai ve bilinçli kullanılır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (/abc|bilinc/.test(slug)) {
    return [
      {
        stem: `${brand}: Bilinci kapalı kazazedede ilk kontrol sırası hangisidir?`,
        choices: {
          A: 'Nabız → solunum → hava yolu',
          B: 'Hava yolu → solunum → dolaşım (ABC)',
          C: 'İlaç vermek',
          D: 'Hemen taşımak',
          E: 'Su içirmek',
        },
        answerKey: 'B',
        steps: [
          { title: '1. ABC', body: 'Hava yolu, solunum, dolaşım sırası izlenir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Bilinç kontrolü nasıl yapılır?`,
        choices: {
          A: 'Seslenerek ve omuzdan hafif uyarılarak',
          B: 'Yüzüne su çarparak zorunlu',
          C: 'Tokatlayarak',
          D: 'İlaç vererek',
          E: 'Koşturarak',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Kontrol', body: 'Sesli uyarı + hafif stimülasyon.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Solunum yoksa (eğitimliysen) sonraki adım nedir?`,
        choices: {
          A: 'Temel yaşam desteği / yardım çağırma protokolü',
          B: 'Su içirmek',
          C: 'Yürüyüşe çıkarmak',
          D: 'Bekleyip hiçbir şey yapmamak',
          E: 'Sıcak çay vermek',
        },
        answerKey: 'A',
        steps: [
          { title: '1. TYD', body: 'Eğitim ve protokole uygun TYD / yardım.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  return [
    {
      stem: `${brand}: Olay yerinde ilk öncelik hangisidir?`,
      choices: {
        A: 'Kendi ve olay yeri güvenliği',
        B: 'Fotoğraf çekmek',
        C: 'Kalabalığa karışmak',
        D: 'Su dağıtmak bilinçsizce',
        E: 'Trafiği hızlandırmak',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Güvenlik', body: 'Önce kendin, sonra olay yeri, sonra kazazede.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Bilinci kapalı kazazedeye su içirmek neden yanlıştır?`,
      choices: {
        A: 'Aspiration / hava yolu riski',
        B: 'Susuzluğu giderir her zaman',
        C: 'Zorunlu tedavidir',
        D: 'Hızlandırır iyileşmeyi',
        E: 'ABC’nin parçasıdır',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Yapma', body: 'Bilinç kapalıysa oral sıvı verilmez.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: 112’yi ararken ne söylenmelidir?`,
      choices: {
        A: 'Konum, olay, kazazede durumu',
        B: 'Sadece isim',
        C: 'Sadece plaka',
        D: 'Hiçbir şey',
        E: 'Sadece hava durumu',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Bildirim', body: 'Konum + durum kritik bilgidir.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
  ];
}

function otherDrafts(topic: Topic): Draft[] {
  const exam = examTag(topic.examType);
  const brand = `${exam} · ${subjectTag(topic.subject)} · ${topic.nameTr}`;

  if (topic.subject === 'civics' || topic.subject === 'current') {
    return [
      {
        stem: `${brand}: Türkiye’de milletvekili seçimleri hangi organı oluşturur?`,
        choices: {
          A: 'TBMM',
          B: 'Yargıtay',
          C: 'Anayasa Mahkemesi',
          D: 'Danıştay',
          E: 'Sayıştay',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Yasama', body: 'Milletvekilleri TBMM’de yer alır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Anayasa’nın üstünlüğü ne anlama gelir?`,
        choices: {
          A: 'Diğer kurallar Anayasa’ya aykırı olamaz',
          B: 'Anayasa yok sayılır',
          C: 'Sadece yönetmelik üstündür',
          D: 'Yalnızca tüzük geçerlidir',
          E: 'Hiçbir kural yoktur',
        },
        answerKey: 'A',
        steps: [
          { title: '1. İlke', body: 'Anayasa hukuk düzeninin tepesindedir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Temel hak ve özgürlükler nerede güvence altındadır?`,
        choices: {
          A: 'Anayasa’da',
          B: 'Sadece yerel duyurularda',
          C: 'Sadece sosyal medyada',
          D: 'Sadece okul yönetmeliğinde',
          E: 'Hiçbir yerde',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Güvence', body: 'Temel haklar Anayasa güvencesindedir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (topic.subject === 'philosophy') {
    return [
      {
        stem: `${brand}: “Bilgi nedir?” sorusu öncelikle hangi alanındır?`,
        choices: {
          A: 'Etik',
          B: 'Estetik',
          C: 'Epistemoloji',
          D: 'Mantık',
          E: 'Siyaset',
        },
        answerKey: 'C',
        steps: [
          { title: '1. Tanım', body: 'Epistemoloji bilgi kuramıdır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap C.` },
        ],
      },
      {
        stem: `${brand}: Mantıkta geçerli çıkarım neye bakar?`,
        choices: {
          A: 'Öncüllerden sonuç zorunlu izler mi',
          B: 'Cümlenin uzunluğuna',
          C: 'Yazarın yaşına',
          D: 'Şık sayısına',
          E: 'Fonta',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Mantık', body: 'Geçerlilik biçimsel ilişkidir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Etik hangi soruyu sorar?`,
        choices: {
          A: 'İyi / doğru eylem nedir?',
          B: 'Atom nedir?',
          C: 'Hız nedir?',
          D: 'Harita nedir?',
          E: 'Fiil nedir?',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Alan', body: 'Etik ahlak felsefesidir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (topic.subject === 'religion') {
    return [
      {
        stem: `${brand}: İslam’da temel ibadetlerden biri hangisidir?`,
        choices: { A: 'Namaz', B: 'Tiyatro', C: 'Spor', D: 'Alışveriş', E: 'Seyahat' },
        answerKey: 'A',
        steps: [
          { title: '1. Bilgi', body: 'Namaz temel ibadetlerdendir.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: İnanç ile ibadet ayrımında doğru ifade hangisidir?`,
        choices: {
          A: 'İnanç iç inanç; ibadet uygulamadır',
          B: 'İkisi aynıdır her zaman',
          C: 'İbadet inançsızlıktır',
          D: 'İnanç yalnızca oruçtur',
          E: 'İbadet yalnızca zekâttır',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Ayrım', body: 'İnanç / ibadet / ahlak boyutları ayrılır.' },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
      {
        stem: `${brand}: Din kültürü sorusunda metne dayanmayan yorum için ne yapılır?`,
        choices: {
          A: 'Elenir',
          B: 'Seçilir',
          C: 'Ezberlenir',
          D: 'Uydurulur',
          E: 'Yok sayılır doğru diye',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Yöntem', body: `${exam} din sorusunda metin sınırına uy.` },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  if (topic.subject === 'english') {
    return [
      {
        stem: `${brand}: “She ___ to school every day.”`,
        choices: { A: 'go', B: 'goes', C: 'going', D: 'gone', E: 'went' },
        answerKey: 'B',
        steps: [
          { title: '1. Özne', body: 'She = 3. tekil → present simple -s.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: “They ___ playing football now.”`,
        choices: { A: 'is', B: 'are', C: 'am', D: 'be', E: 'was' },
        answerKey: 'B',
        steps: [
          { title: '1. Tense', body: 'Present continuous: are + V-ing.' },
          { title: '2. Sonuç', body: `${brand}. Cevap B.` },
        ],
      },
      {
        stem: `${brand}: Reading sorusunda doğru strateji hangisidir?`,
        choices: {
          A: 'Kökü oku, metinde dayanak bul',
          B: 'Şıkları ezberle',
          C: 'Metni atla',
          D: 'En uzun şıkkı seç',
          E: 'İlk şıkkı seç',
        },
        answerKey: 'A',
        steps: [
          { title: '1. Strateji', body: `${exam} İngilizce’de dayanak şart.` },
          { title: '2. Sonuç', body: `${brand}. Cevap A.` },
        ],
      },
    ];
  }

  return [
    {
      stem: `${brand}: Bu konuda doğru yaklaşım hangisidir?`,
      choices: {
        A: 'Şıkları metne / veriye götürmek',
        B: 'Ezberle rastgele seçmek',
        C: 'Soru kökünü okumamak',
        D: 'Zamanı boşa harcamak',
        E: 'Şıkları hiç elemek',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Strateji', body: 'Dayanaklı seçim yap; kökü oku.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Emin değilsen hangi yöntem işe yarar?`,
      choices: {
        A: 'Eleme ile daraltmak',
        B: 'Rastgele işaretlemek hemen',
        C: 'Soruyu boş bırakıp paniklemek',
        D: 'Zamanı yok saymak',
        E: 'Kökü yırtmak',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Eleme', body: `${exam} stratejisinde eleme puan kazandırır.` },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
    {
      stem: `${brand}: Yanlış şık genelde neyi yapar?`,
      choices: {
        A: 'Metni / veriyi aşar veya çarpıtır',
        B: 'Her zaman kısadır',
        C: 'Her zaman uzundur',
        D: 'Her zaman A şıkkıdır',
        E: 'Hiçbir özellik taşımaz',
      },
      answerKey: 'A',
      steps: [
        { title: '1. Tuzak', body: 'Aşırı genelleme ve dayanak yokluğu tuzaktır.' },
        { title: '2. Sonuç', body: `${brand}. Cevap A.` },
      ],
    },
  ];
}

/** Build up to MIN_SAMPLES_PER_TOPIC topic-aware drafts. */
export function buildSampleDrafts(topic: Topic): ItemBankItem[] {
  const subject = topic.subject as Subject;
  let drafts: Draft[];
  switch (subject) {
    case 'math':
    case 'geometry':
      drafts = mathDrafts(topic);
      break;
    case 'turkish':
    case 'literature':
      drafts = verbalDrafts(topic);
      break;
    case 'science':
    case 'physics':
    case 'chemistry':
    case 'biology':
      drafts = scienceDrafts(topic);
      break;
    case 'history':
      drafts = historyDrafts(topic);
      break;
    case 'geography':
      drafts = geographyDrafts(topic);
      break;
    case 'traffic':
      drafts = trafikTrafficDrafts(topic);
      break;
    case 'vehicle':
      drafts = trafikVehicleDrafts(topic);
      break;
    case 'firstaid':
      drafts = firstaidDrafts(topic);
      break;
    default:
      drafts = otherDrafts(topic);
  }
  return pack(topic, drafts);
}

/**
 * Pad every catalog topic to MIN_SAMPLES_PER_TOPIC.
 * `existingCounts` = already present hand-authored items per topicId.
 */
export function buildCoverageSamples(
  existingCounts: Map<string, number> = new Map(),
): ItemBankItem[] {
  const exams: ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'];
  const out: ItemBankItem[] = [];
  for (const exam of exams) {
    for (const topic of topicsForExam(exam)) {
      if (!findTopic(topic.id)) continue;
      const have = existingCounts.get(topic.id) ?? 0;
      const need = Math.max(0, MIN_SAMPLES_PER_TOPIC - have);
      if (need === 0) continue;
      const drafts = buildSampleDrafts(topic);
      // Prefer later variants when padding a curated topic that already has 1–2 items
      out.push(...drafts.slice(have, have + need));
    }
  }
  return out;
}