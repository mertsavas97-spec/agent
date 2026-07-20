/** Turkish-safe casing — never use CSS `textTransform: 'uppercase'` for TR UI. */

export function trUpper(value: string): string {
  return value.toLocaleUpperCase('tr-TR');
}

export function trLower(value: string): string {
  return value.toLocaleLowerCase('tr-TR');
}

/** Common UI eyebrows already spelled with correct dotted İ where needed. */
export const TR_EYEBROW = {
  progress: 'İLERLEME',
  exam: 'SINAV',
  curriculum: 'MÜFREDAT',
  records: 'KAYITLAR',
  content: 'İÇERİK',
  tip: 'İPUCU',
  correctAnswer: 'DOĞRU CEVAP',
  activeExamMode: 'AKTİF SINAV MODU',
  solveKicker: 'SORU ÇÖZ',
  fromCamera: 'KAMERADAN',
  fromGallery: 'GALERİDEN',
  settings: 'AYARLAR',
  premium: 'PREMİUM',
  legal: 'HUKUKİ',
  push: 'BİLDİRİMLER',
  profile: 'PROFİL',
  teacherTip: 'ÖĞRETMEN İPUCU',
  correct: 'DOĞRU',
} as const;
