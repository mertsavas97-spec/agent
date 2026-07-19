import type { ExamType, Subject } from '../types/contracts';

export const SUBJECT_LABEL: Record<Exclude<Subject, 'unknown'>, string> = {
  math: 'Matematik',
  turkish: 'Türkçe',
  science: 'Fen Bilimleri',
  physics: 'Fizik',
  chemistry: 'Kimya',
  biology: 'Biyoloji',
  history: 'Tarih',
  geography: 'Coğrafya',
  philosophy: 'Felsefe',
  literature: 'Edebiyat',
  religion: 'Din Kültürü',
  english: 'İngilizce',
  geometry: 'Geometri',
  civics: 'Vatandaşlık',
  current: 'Güncel Bilgiler',
};

export function subjectsForExam(exam: ExamType): Exclude<Subject, 'unknown'>[] {
  switch (exam) {
    case 'lgs':
      return ['turkish', 'math', 'science', 'history', 'religion', 'english'];
    case 'ygs':
      return [
        'turkish',
        'literature',
        'math',
        'physics',
        'chemistry',
        'biology',
        'history',
        'geography',
        'philosophy',
        'religion',
      ];
    case 'kpss':
      return ['turkish', 'math', 'geometry', 'history', 'geography', 'civics', 'current'];
    default: {
      const _e: never = exam;
      return _e;
    }
  }
}

export function isKnownSubject(v: unknown): v is Exclude<Subject, 'unknown'> {
  return typeof v === 'string' && v in SUBJECT_LABEL;
}
