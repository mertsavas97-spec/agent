import type { ExamType, Subject } from '../types/contracts';

export type Topic = {
  id: string;
  examType: ExamType;
  subject: Subject;
  nameTr: string;
};

function tid(exam: ExamType, subject: Subject, slug: string): string {
  return `${exam}-${subject}-${slug}`;
}

export const LGS_TOPICS: Topic[] = [
  { id: tid('lgs', 'math', 'kesirler'), examType: 'lgs', subject: 'math', nameTr: 'Kesirler' },
  { id: tid('lgs', 'math', 'uslu-sayilar'), examType: 'lgs', subject: 'math', nameTr: 'Üslü Sayılar' },
  { id: tid('lgs', 'math', 'koklu-sayilar'), examType: 'lgs', subject: 'math', nameTr: 'Köklü Sayılar' },
  { id: tid('lgs', 'math', 'oran-oranti'), examType: 'lgs', subject: 'math', nameTr: 'Oran Orantı' },
  { id: tid('lgs', 'math', 'yuzdeler'), examType: 'lgs', subject: 'math', nameTr: 'Yüzdeler' },
  { id: tid('lgs', 'math', 'denklemler'), examType: 'lgs', subject: 'math', nameTr: 'Denklemler' },
  { id: tid('lgs', 'math', 'olasilik'), examType: 'lgs', subject: 'math', nameTr: 'Olasılık' },
  { id: tid('lgs', 'math', 'veri-analiz'), examType: 'lgs', subject: 'math', nameTr: 'Veri Analizi' },
  { id: tid('lgs', 'turkish', 'anlam'), examType: 'lgs', subject: 'turkish', nameTr: 'Sözcükte Anlam' },
  { id: tid('lgs', 'turkish', 'paragraf'), examType: 'lgs', subject: 'turkish', nameTr: 'Paragraf' },
];

export const YGS_TOPICS: Topic[] = [
  { id: tid('ygs', 'math', 'temel-kavramlar'), examType: 'ygs', subject: 'math', nameTr: 'Temel Kavramlar' },
  { id: tid('ygs', 'math', 'sayilar'), examType: 'ygs', subject: 'math', nameTr: 'Sayılar' },
  { id: tid('ygs', 'math', 'bolunebilme'), examType: 'ygs', subject: 'math', nameTr: 'Bölünebilme' },
  { id: tid('ygs', 'math', 'faktoriyel'), examType: 'ygs', subject: 'math', nameTr: 'Faktöriyel' },
  { id: tid('ygs', 'math', 'denklemler'), examType: 'ygs', subject: 'math', nameTr: 'Denklemler' },
  { id: tid('ygs', 'math', 'esitsizlik'), examType: 'ygs', subject: 'math', nameTr: 'Eşitsizlikler' },
  { id: tid('ygs', 'math', 'fonksiyonlar'), examType: 'ygs', subject: 'math', nameTr: 'Fonksiyonlar' },
  { id: tid('ygs', 'math', 'trigonometri'), examType: 'ygs', subject: 'math', nameTr: 'Trigonometri' },
  { id: tid('ygs', 'turkish', 'anlam'), examType: 'ygs', subject: 'turkish', nameTr: 'Anlam Bilgisi' },
  { id: tid('ygs', 'turkish', 'paragraf'), examType: 'ygs', subject: 'turkish', nameTr: 'Paragraf' },
];

export const KPSS_TOPICS: Topic[] = [
  { id: tid('kpss', 'math', 'temel-islemler'), examType: 'kpss', subject: 'math', nameTr: 'Temel İşlemler' },
  { id: tid('kpss', 'math', 'kesirler'), examType: 'kpss', subject: 'math', nameTr: 'Kesirler' },
  { id: tid('kpss', 'math', 'yuzde'), examType: 'kpss', subject: 'math', nameTr: 'Yüzde Problemleri' },
  { id: tid('kpss', 'math', 'oran-oranti'), examType: 'kpss', subject: 'math', nameTr: 'Oran Orantı' },
  { id: tid('kpss', 'math', 'problemler'), examType: 'kpss', subject: 'math', nameTr: 'Problemler' },
  { id: tid('kpss', 'math', 'geometri-temel'), examType: 'kpss', subject: 'math', nameTr: 'Temel Geometri (metin)' },
  { id: tid('kpss', 'math', 'veri'), examType: 'kpss', subject: 'math', nameTr: 'Tablo / Grafik' },
  { id: tid('kpss', 'turkish', 'dilbilgisi'), examType: 'kpss', subject: 'turkish', nameTr: 'Dil Bilgisi' },
  { id: tid('kpss', 'turkish', 'anlam'), examType: 'kpss', subject: 'turkish', nameTr: 'Anlam Bilgisi' },
  { id: tid('kpss', 'turkish', 'paragraf'), examType: 'kpss', subject: 'turkish', nameTr: 'Paragraf' },
];

export function topicsForExam(exam: ExamType): Topic[] {
  if (exam === 'lgs') return LGS_TOPICS;
  if (exam === 'ygs') return YGS_TOPICS;
  return KPSS_TOPICS;
}
