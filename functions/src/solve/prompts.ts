import { topicsForExam } from '../data/topics';
import { SUBJECT_LABEL, isKnownSubject } from '../data/subjects';
import type { ExamType, Subject } from '../types/contracts';

import { itemBankFewShot } from './prompts/fewshots';
import { teacherLineForSubject } from './subjectTeacher';

const SUBJECT_ENUM =
  '"math"|"turkish"|"science"|"physics"|"chemistry"|"biology"|"history"|"geography"|"philosophy"|"literature"|"religion"|"english"|"geometry"|"civics"|"current"|"traffic"|"vehicle"|"firstaid"|"unknown"';

function examAudience(examType: ExamType): string {
  switch (examType) {
    case 'lgs':
      return 'LGS (8. sınıf MEB): Türkçe, Matematik, Fen, İnkılap, Din, İngilizce.';
    case 'ygs':
      return 'YGS ürün etiketi = YKS TYT/AYT hattı (eski LYS alanları AYT ile). Türkçe/Edebiyat, Matematik, Fizik, Kimya, Biyoloji, Tarih, Coğrafya, Felsefe, Din.';
    case 'kpss':
      return 'KPSS GY–GK: Türkçe, Matematik, Geometri, Tarih, Coğrafya, Vatandaşlık, Güncel.';
    case 'trafik':
      return 'Trafik / ehliyet (MTS): Trafik ve çevre, işaretler, araç tekniği, ilk yardım.';
    default: {
      const _e: never = examType;
      return _e;
    }
  }
}

function catalogHint(examType: ExamType, subject?: Subject): string {
  const topics = topicsForExam(examType).filter((t) =>
    subject && subject !== 'unknown' ? t.subject === subject : true,
  );
  const sample = topics.slice(0, 12).map((t) => t.id).join(', ');
  return `topicId mümkünse şu katalogdan seç: ${sample}${topics.length > 12 ? ', …' : ''}`;
}

function jsonSchemaBlock(): string {
  return [
    'Yanıtını YALNIZCA aşağıdaki JSON şemasında ver:',
    '{',
    '  "isQuestion": boolean,',
    '  "unsupported": boolean,',
    '  "unsupportedReason": string | null,',
    `  "subject": ${SUBJECT_ENUM},`,
    '  "topicId": string | null,',
    '  "steps": [ { "title": string, "body": string } ]',
    '}',
  ].join('\n');
}

/** @deprecated prefer systemPromptForSolve — kept for math-only tests */
export function mathSystemPrompt(examType: ExamType): string {
  return systemPromptForSolve(examType, 'math');
}

export function systemPromptForSolve(
  examType: ExamType,
  subjectHint?: Subject | null,
): string {
  const subject =
    subjectHint && isKnownSubject(subjectHint) ? subjectHint : undefined;
  const subjectLine = subject
    ? `Öncelik ders: ${SUBJECT_LABEL[subject]} (${subject}). Görsel başka derse aitse doğru subject yaz.`
    : 'Görseldeki sorunun dersini (subject) doğru tespit et.';

  return [
    teacherLineForSubject(examType, subject),
    itemBankFewShot(examType, subject),
    examAudience(examType),
    subjectLine,
    'Adım adım, sade Türkçe ile çöz / anlat.',
    'Diyagram çizimi veya şekil render gerektiriyorsa unsupported=true yaz (metin yetmiyorsa).',
    'Görsel bir soru değilse isQuestion=false yaz.',
    catalogHint(examType, subject),
    'Doğruluk garantisi verme; şeffaf ve kontrollü anlat.',
    jsonSchemaBlock(),
  ].join('\n');
}

export function explainAgainPrompt(examType: ExamType, subject?: Subject | null): string {
  const sub =
    subject && isKnownSubject(subject) ? ` Ders: ${SUBJECT_LABEL[subject]}.` : '';
  return [
    teacherLineForSubject(examType, subject),
    examAudience(examType),
    `Öğrenci önceki çözümü anlamadı.${sub}`,
    'Aynı soruyu DAHA SADE, daha kısa cümlelerle, gerekirse günlük hayattan bir benzetmeyle yeniden anlat.',
    'Yeni ileri konu ekleme. Sadece açıklama metni üret (düz Türkçe paragraf veya maddeler).',
  ].join('\n');
}

export { turkishSystemPromptStub } from './prompts/turkish/stubs';
