import type { ExamType } from '../types/contracts';

import { KPSS_MATH_FEWSHOT, KPSS_MATH_TEACHER } from './prompts/math/kpss';
import { LGS_MATH_FEWSHOT, LGS_MATH_TEACHER } from './prompts/math/lgs';
import { YGS_MATH_FEWSHOT, YGS_MATH_TEACHER } from './prompts/math/ygs';
import { turkishSystemPromptStub } from './prompts/turkish/stubs';

function examTeacherLine(examType: ExamType): string {
  switch (examType) {
    case 'lgs':
      return LGS_MATH_TEACHER;
    case 'ygs':
      return YGS_MATH_TEACHER;
    case 'kpss':
      return KPSS_MATH_TEACHER;
    default: {
      const _e: never = examType;
      return _e;
    }
  }
}

function examFewShot(examType: ExamType): string {
  switch (examType) {
    case 'lgs':
      return LGS_MATH_FEWSHOT;
    case 'ygs':
      return YGS_MATH_FEWSHOT;
    case 'kpss':
      return KPSS_MATH_FEWSHOT;
    default: {
      const _e: never = examType;
      return _e;
    }
  }
}

export function mathSystemPrompt(examType: ExamType): string {
  return [
    examTeacherLine(examType),
    examFewShot(examType),
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

export { turkishSystemPromptStub };
