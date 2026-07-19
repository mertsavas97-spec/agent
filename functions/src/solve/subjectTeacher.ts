/**
 * Ders ağacı (2020–2026) → öğretmen persona satırı.
 * Math prompt dosyaları + Türkçe stub; diğer dersler kısa seviye satırı.
 */
import type { ExamType, Subject } from '../types/contracts';
import { SUBJECT_LABEL } from '../data/subjects';
import { KPSS_MATH_TEACHER } from './prompts/math/kpss';
import { LGS_MATH_TEACHER } from './prompts/math/lgs';
import { YGS_MATH_TEACHER } from './prompts/math/ygs';
import { turkishTeacherLine } from './prompts/turkish/stubs';

function mathTeacher(examType: ExamType): string {
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

function examLevel(examType: ExamType): string {
  switch (examType) {
    case 'lgs':
      return 'LGS / 8. sınıf MEB seviyesinde';
    case 'ygs':
      return 'YGS/YKS (TYT–AYT) lise seviyesinde';
    case 'kpss':
      return 'KPSS GY–GK yetişkin aday seviyesinde';
    default: {
      const _e: never = examType;
      return _e;
    }
  }
}

export function teacherLineForSubject(
  examType: ExamType,
  subject?: Subject | null,
): string {
  if (!subject || subject === 'unknown') {
    return mathTeacher(examType);
  }
  if (subject === 'math' || subject === 'geometry') {
    return mathTeacher(examType);
  }
  if (subject === 'turkish') {
    return turkishTeacherLine(examType);
  }
  const label = SUBJECT_LABEL[subject];
  return `Sen bir ${examLevel(examType)} ${label} öğretmenisin. Sade Türkçe ile adım adım anlat; ezber cümle değil, mantık kur.`;
}
