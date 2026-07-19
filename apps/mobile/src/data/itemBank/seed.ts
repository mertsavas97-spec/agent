import type { ExamType } from '@/src/lib/api/types';

import type { ItemBankItem } from './types';

/** Bundled MVP seed — mirrors content/item-bank (telifsiz). */
export const ITEM_BANK_SEED: ItemBankItem[] = [
  {
    id: 'lgs-math-kesirler-001',
    examType: 'lgs',
    subject: 'math',
    topicId: 'lgs-math-kesirler',
    difficulty: 'easy',
    format: 'multiple_choice',
    stem: "Bir pastanın 3/8'i yeniyor. Kalan pastanın 1/2'si de yenilirse, pastanın başlangıçta ne kadarı kalır?",
    choices: { A: '1/8', B: '5/16', C: '3/16', D: '1/4', E: '5/8' },
    answerKey: 'B',
    explanationSteps: [
      {
        title: '1. Ne kaldı?',
        body: 'Bütün 1. İlk yemeden sonra kalan: 1 − 3/8 = 5/8.',
      },
      {
        title: '2. Kalanın yarısı',
        body: 'Kalanın 1/2’si yenir: (5/8)×(1/2) = 5/16. Bu, ikinci yemedir — kalanın tamamı değil.',
      },
      {
        title: '3. Son durum',
        body: 'İkinci yemeden sonra pastada kalan: 5/8 − 5/16 = 10/16 − 5/16 = 5/16. Cevap B.',
      },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'lgs-math-yuzdeler-001',
    examType: 'lgs',
    subject: 'math',
    topicId: 'lgs-math-yuzdeler',
    difficulty: 'easy',
    format: 'multiple_choice',
    stem: 'Bir kitabın fiyatı 80 TL iken %25 indirim yapılıyor. İndirimli fiyat kaç TL’dir?',
    choices: { A: '20', B: '40', C: '60', D: '65', E: '70' },
    answerKey: 'C',
    explanationSteps: [
      { title: '1. İndirim tutarı', body: '%25 = 25/100. İndirim: 80 × 0,25 = 20 TL.' },
      { title: '2. Ödenecek', body: '80 − 20 = 60 TL. (veya 80 × 0,75 = 60). Cevap C.' },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'lgs-math-oran-001',
    examType: 'lgs',
    subject: 'math',
    topicId: 'lgs-math-oran-oranti',
    difficulty: 'mid',
    format: 'multiple_choice',
    stem: '3 işçinin 4 günde bitirdiği işi 6 işçi kaç günde bitirir? (aynı hızda)',
    choices: { A: '1', B: '2', C: '3', D: '4', E: '6' },
    answerKey: 'B',
    explanationSteps: [
      {
        title: '1. İş miktarı',
        body: '3 işçi × 4 gün = 12 işçi-gün. Toplam iş 12 birim.',
      },
      {
        title: '2. Yeni süre',
        body: '6 işçi → 12 ÷ 6 = 2 gün. Ters orantı: işçi artınca gün azalır. Cevap B.',
      },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'lgs-turkish-paragraf-001',
    examType: 'lgs',
    subject: 'turkish',
    topicId: 'lgs-turkish-paragraf',
    difficulty: 'easy',
    format: 'multiple_choice',
    stem: '“Yağmur dinince sokaklar yine doldu; çocuklar birikintilerde gülerek koştu.” Bu cümleden kesin olarak çıkarılabilecek yargı hangisidir?',
    choices: {
      A: 'Yağmur hiç dinmemiştir.',
      B: 'Yağmur dinmiştir ve çocuklar dışarıdadır.',
      C: 'Sokaklar boş kalmıştır.',
      D: 'Çocuklar üzgündür.',
      E: 'Hava karanlıktır.',
    },
    answerKey: 'B',
    explanationSteps: [
      {
        title: '1. Metni ayıkla',
        body: '“Yağmur dinince” → yağmur dinmiştir. “çocuklar … koştu” → çocuklar dışarıda.',
      },
      {
        title: '2. Eleme',
        body: 'A, C, D, E metinden desteklenmez. Kesin yargı B’dir.',
      },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'ygs-math-denklemler-001',
    examType: 'ygs',
    subject: 'math',
    topicId: 'ygs-math-denklemler',
    difficulty: 'mid',
    format: 'multiple_choice',
    stem: '2(x - 3) + 5 = 3x - 1 denklemini sağlayan x değeri kaçtır?',
    choices: { A: '0', B: '2', C: '4', D: '6', E: '8' },
    answerKey: 'A',
    explanationSteps: [
      { title: '1. Sol taraf', body: '2(x − 3) + 5 = 2x − 6 + 5 = 2x − 1.' },
      { title: '2. Eşitle', body: '2x − 1 = 3x − 1 → her iki tarafa +1: 2x = 3x.' },
      { title: '3. Sonuç', body: '2x − 3x = 0 → −x = 0 → x = 0. Kontrol: sol −1, sağ −1. Cevap A.' },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'ygs-math-fonksiyon-001',
    examType: 'ygs',
    subject: 'math',
    topicId: 'ygs-math-fonksiyonlar',
    difficulty: 'mid',
    format: 'multiple_choice',
    stem: 'f(x) = 2x − 3 için f(4) kaçtır?',
    choices: { A: '3', B: '5', C: '7', D: '8', E: '11' },
    answerKey: 'B',
    explanationSteps: [
      { title: '1. Yerine koy', body: 'f(4) = 2·4 − 3 = 8 − 3.' },
      { title: '2. Sonuç', body: 'f(4) = 5. Cevap B.' },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'ygs-math-temel-001',
    examType: 'ygs',
    subject: 'math',
    topicId: 'ygs-math-temel-kavramlar',
    difficulty: 'easy',
    format: 'multiple_choice',
    stem: '|−7| + |3| işleminin sonucu kaçtır?',
    choices: { A: '−10', B: '−4', C: '4', D: '10', E: '21' },
    answerKey: 'D',
    explanationSteps: [
      { title: '1. Mutlak değer', body: '|−7| = 7 (uzaklık), |3| = 3.' },
      { title: '2. Topla', body: '7 + 3 = 10. Cevap D.' },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'kpss-math-yuzde-001',
    examType: 'kpss',
    subject: 'math',
    topicId: 'kpss-math-yuzde',
    difficulty: 'mid',
    format: 'multiple_choice',
    stem: 'Bir ürünün fiyatı önce %20 artıyor, sonra %20 azalıyor. Son fiyat ilk fiyatın yüzde kaçıdır?',
    choices: { A: '%96', B: '%100', C: '%104', D: '%80', E: '%120' },
    answerKey: 'A',
    explanationSteps: [
      { title: '1. Artış', body: 'İlk fiyatı 100 al → %20 artış: 120.' },
      { title: '2. Azalış', body: '%20 azalış: 120 × 0,80 = 96.' },
      {
        title: '3. Yorum',
        body: 'Son fiyat ilk fiyatın %96’sı. Aynı oranlı artıp azalmak neti sıfırlamaz. Cevap A.',
      },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'kpss-math-oran-001',
    examType: 'kpss',
    subject: 'math',
    topicId: 'kpss-math-oran-oranti',
    difficulty: 'mid',
    format: 'multiple_choice',
    stem: 'a/b = 2/5 ve a + b = 28 ise a kaçtır?',
    choices: { A: '4', B: '8', C: '10', D: '14', E: '20' },
    answerKey: 'B',
    explanationSteps: [
      { title: '1. Oran parçaları', body: 'a : b = 2 : 5 → toplam 7 parça = 28 → 1 parça = 4.' },
      { title: '2. a', body: 'a = 2 × 4 = 8. Cevap B.' },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
  {
    id: 'kpss-math-problem-001',
    examType: 'kpss',
    subject: 'math',
    topicId: 'kpss-math-problemler',
    difficulty: 'mid',
    format: 'multiple_choice',
    stem: 'Bir otobüs 120 km yolu 2 saatte gidiyor. Aynı hızla 180 km kaç kaç saatte gider?',
    choices: { A: '2', B: '2,5', C: '3', D: '3,5', E: '4' },
    answerKey: 'C',
    explanationSteps: [
      { title: '1. Hız', body: 'Hız = 120 / 2 = 60 km/saat.' },
      { title: '2. Süre', body: '180 / 60 = 3 saat. Cevap C.' },
    ],
    transparencyNote: 'Özgün örnek anlatım — kontrol etmeni öneririz.',
  },
];

export function itemsForExam(exam: ExamType): ItemBankItem[] {
  return ITEM_BANK_SEED.filter((i) => i.examType === exam);
}

export function itemsForExamSubject(exam: ExamType, subject: string): ItemBankItem[] {
  return ITEM_BANK_SEED.filter((i) => i.examType === exam && i.subject === subject);
}

export function findItem(id: string): ItemBankItem | undefined {
  return ITEM_BANK_SEED.find((i) => i.id === id);
}

export function itemsForTopic(topicId: string): ItemBankItem[] {
  return ITEM_BANK_SEED.filter((i) => i.topicId === topicId);
}
