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
    choices: {
      A: '1/8',
      B: '5/16',
      C: '3/16',
      D: '1/4',
      E: '5/8',
    },
    answerKey: 'B',
    explanationSteps: [
      { title: '1. Adım', body: 'İlk yenenden sonra kalan: 1 - 3/8 = 5/8.' },
      {
        title: '2. Adım',
        body: "Kalanın yarısı yenir: (5/8) × (1/2) = 5/16 yenir; bu ikinci yemedir.",
      },
      {
        title: '3. Adım',
        body: 'Toplam yenmeyen: 5/8 - 5/16 = 10/16 - 5/16 = 5/16. Cevap 5/16.',
      },
    ],
    transparencyNote: 'Örnek çözüm — kontrol etmeni öneririz.',
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
      { title: '1. Adım', body: 'Sol tarafı aç: 2x - 6 + 5 = 2x - 1.' },
      {
        title: '2. Adım',
        body: 'Denklem: 2x - 1 = 3x - 1. Her iki tarafa +1 ekle: 2x = 3x.',
      },
      {
        title: '3. Adım',
        body: '2x - 3x = 0 → -x = 0 → x = 0. Kontrol: sol 2(0-3)+5 = -1, sağ -1. Cevap A.',
      },
    ],
    transparencyNote: 'Örnek çözüm — kontrol etmeni öneririz.',
  },
  {
    id: 'kpss-math-yuzde-001',
    examType: 'kpss',
    subject: 'math',
    topicId: 'kpss-math-yuzde',
    difficulty: 'mid',
    format: 'multiple_choice',
    stem: "Bir ürünün fiyatı önce %20 artıyor, sonra %20 azalıyor. Son fiyat ilk fiyatın yüzde kaçıdır?",
    choices: { A: '%96', B: '%100', C: '%104', D: '%80', E: '%120' },
    answerKey: 'A',
    explanationSteps: [
      { title: '1. Adım', body: 'İlk fiyatı 100 al; %20 artış → 120.' },
      { title: '2. Adım', body: '%20 azalış: 120 × 0,80 = 96.' },
      { title: '3. Adım', body: 'Son fiyat ilk fiyatın %96’sı.' },
    ],
    transparencyNote: 'Örnek çözüm — kontrol etmeni öneririz.',
  },
];

export function itemsForExam(exam: ExamType): ItemBankItem[] {
  return ITEM_BANK_SEED.filter((i) => i.examType === exam);
}

export function findItem(id: string): ItemBankItem | undefined {
  return ITEM_BANK_SEED.find((i) => i.id === id);
}
