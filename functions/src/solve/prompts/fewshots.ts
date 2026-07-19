/**
 * Owned item-bank few-shots (T068) — telifsiz seed metinleri.
 * Kaynak: content/item-bank (metin kopyası ürün sahipli; ÖSYM kitapçığı değil).
 * Subject-aware: exam + subjectHint ile seçilir (ders ağacı 2020–2026).
 */
import type { ExamType, Subject } from '../../types/contracts';

const LGS_KESIRLER = [
  'Örnek (özgün item-bank, LGS Matematik / Kesirler):',
  "Soru: Bir pastanın 3/8'i yeniyor. Kalan pastanın 1/2'si de yenilirse başlangıçta ne kadarı kalır?",
  '1. Adım: İlk yenenden sonra kalan 1 - 3/8 = 5/8.',
  '2. Adım: Kalanın yarısı yenir: (5/8)×(1/2)=5/16.',
  '3. Adım: Kalan: 5/8 - 5/16 = 5/16. Cevap 5/16 (şık B).',
  'topicId: lgs-math-kesirler',
].join('\n');

const YGS_DENKLEM = [
  'Örnek (özgün item-bank, YGS/YKS Matematik / Denklemler):',
  'Soru: 2(x - 3) + 5 = 3x - 1 denklemini sağlayan x?',
  '1. Adım: Sol: 2x - 6 + 5 = 2x - 1.',
  '2. Adım: 2x - 1 = 3x - 1 → +1: 2x = 3x.',
  '3. Adım: -x = 0 → x = 0. Cevap A.',
  'topicId: ygs-math-denklemler',
].join('\n');

const KPSS_YUZDE = [
  'Örnek (özgün item-bank, KPSS Matematik / Yüzde):',
  'Soru: Fiyat önce %20 artıp sonra %20 azalırsa son fiyat ilk fiyatın yüzde kaçı?',
  '1. Adım: 100 → %20 artış = 120.',
  '2. Adım: 120 × 0,80 = 96.',
  '3. Adım: Son = %96. Cevap A.',
  'topicId: kpss-math-yuzde',
].join('\n');

/** Format-discipline shots for Türkçe (owned stems; not MEB/ÖSYM text). */
const LGS_TURKISH = [
  'Örnek (özgün item-bank, LGS Türkçe / Sözcükte anlam):',
  'Soru: "Bu açıklama konuyu aydınlattı." cümlesinde "aydınlattı" sözcüğünün anlamı hangisine yakındır?',
  '1. Adım: Bağlama bak — açıklama sonrası anlaşılırlık artmış.',
  '2. Adım: "Aydınlatmak" burada ışık vermek değil, netleştirmek anlamında.',
  '3. Adım: En yakın: "daha anlaşılır kıldı". topicId: lgs-turkish-sozcukte-anlam',
].join('\n');

const YGS_TURKISH = [
  'Örnek (özgün item-bank, YGS/YKS Türkçe / Paragraf):',
  'Soru: Paragrafta asıl anlatılmak istenen nedir? (kısa özgün metin varsayımı)',
  '1. Adım: Giriş–gelişme–sonuç izlerini ayır.',
  '2. Adım: Yan düşünceleri eleyip ana yargıyı seç.',
  '3. Adım: Cevabı tek cümlede özetle. topicId: ygs-turkish-paragraf',
].join('\n');

const KPSS_TURKISH = [
  'Örnek (özgün item-bank, KPSS Türkçe / Anlam):',
  'Soru: Aşağıdaki cümlede altı çizili sözcük hangi anlamda kullanılmıştır?',
  '1. Adım: Cümle bağlamını oku; sözlüğün ilk anlamını dayatma.',
  '2. Adım: Mecaz / terim / günlük kullanım ayrımı yap.',
  '3. Adım: Şıkları bağlamla eşleştir. topicId: kpss-turkish-anlam',
].join('\n');

function mathFewShot(examType: ExamType): string {
  switch (examType) {
    case 'lgs':
      return LGS_KESIRLER;
    case 'ygs':
      return YGS_DENKLEM;
    case 'kpss':
      return KPSS_YUZDE;
    default: {
      const _e: never = examType;
      return _e;
    }
  }
}

function turkishFewShot(examType: ExamType): string {
  switch (examType) {
    case 'lgs':
      return LGS_TURKISH;
    case 'ygs':
      return YGS_TURKISH;
    case 'kpss':
      return KPSS_TURKISH;
    default: {
      const _e: never = examType;
      return _e;
    }
  }
}

/**
 * Prefer subject-matched few-shot; fall back to math format example
 * (JSON step discipline) when no dedicated bank exists yet.
 */
export function itemBankFewShot(
  examType: ExamType,
  subject?: Subject | null,
): string {
  if (subject === 'turkish') return turkishFewShot(examType);
  if (subject === 'math' || subject === 'geometry' || !subject || subject === 'unknown') {
    return mathFewShot(examType);
  }
  // Diğer dersler: format disiplinini math örneğinden al + subject notu
  return [
    mathFewShot(examType),
    `(Not: Bu soru muhtemelen ${subject} dersi; adım formatını aynı tut, subject alanını doğru yaz.)`,
  ].join('\n');
}
