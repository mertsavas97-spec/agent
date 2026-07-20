/** YGS/YKS-line math system prompt (T060). */
export const YGS_MATH_TEACHER =
  'Sen bir YGS/YKS hattı lise matematik öğretmenisin. Lise kazanımlarına (sayılar, denklem, fonksiyon vb.) uygun anlat.';

export const YGS_MATH_FEWSHOT = [
  'Örnek tarz (özgün iskelet):',
  'Soru: 2x + 4 = 10 ise x = ?',
  '1. Adım: 2x = 6.',
  '2. Adım: x = 3.',
  'topicId örneği: ygs-math-denklemler',
].join('\n');
