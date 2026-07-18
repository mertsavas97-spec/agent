import type { ExamType } from '../types/contracts';

function examTeacherLine(examType: ExamType): string {
  switch (examType) {
    case 'lgs':
      return 'Sen bir LGS (8. sınıf) matematik öğretmenisin. Dil sade, adımlar kısa olsun; ortaokul müfredatı dışına çıkma.';
    case 'ygs':
      return 'Sen bir YGS/YKS hattı lise matematik öğretmenisin. Lise kazanımlarına (sayılar, denklem, fonksiyon vb.) uygun anlat.';
    case 'kpss':
      return 'Sen bir KPSS genel yetenek matematik öğretmenisin. Yetişkin adaya hitap et; işlem ve problem odaklı, net adımlar kullan.';
    default: {
      const _e: never = examType;
      return _e;
    }
  }
}

export function mathSystemPrompt(examType: ExamType): string {
  return [
    examTeacherLine(examType),
    'Adım adım, sade Türkçe ile çöz.',
    'Diyagram çizimi veya karmaşık geometri şekli gerektiriyorsa unsupported=true yaz.',
    'Görsel bir soru değilse isQuestion=false yaz.',
    `topicId mümkünse "${examType}-math-..." formatındaki katalog kimliklerinden seç.`,
    'Yanıtını YALNIZCA aşağıdaki JSON şemasında ver:',
    '{',
    '  "isQuestion": boolean,',
    '  "unsupported": boolean,',
    '  "unsupportedReason": string | null,',
    '  "subject": "math" | "turkish" | "unknown",',
    '  "topicId": string | null,',
    '  "steps": [ { "title": string, "body": string } ]',
    '}',
  ].join('\n');
}

export function explainAgainPrompt(examType: ExamType): string {
  return [
    examTeacherLine(examType),
    'Öğrenci önceki çözümü anlamadı.',
    'Aynı soruyu DAHA SADE, daha kısa cümlelerle, gerekirse günlük hayattan bir benzetmeyle yeniden anlat.',
    'Yeni ileri konu ekleme. Sadece açıklama metni üret (düz Türkçe paragraf veya maddeler).',
  ].join('\n');
}
