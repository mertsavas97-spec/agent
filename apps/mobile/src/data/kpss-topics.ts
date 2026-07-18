import type { Topic } from './topics';
import { topicId } from './topics';

/** KPSS genel yetenek matematik iskelet katalog. */
export const KPSS_TOPICS: Topic[] = [
  { id: topicId('kpss', 'math', 'temel-islemler'), examType: 'kpss', subject: 'math', nameTr: 'Temel İşlemler' },
  { id: topicId('kpss', 'math', 'kesirler'), examType: 'kpss', subject: 'math', nameTr: 'Kesirler' },
  { id: topicId('kpss', 'math', 'yuzde'), examType: 'kpss', subject: 'math', nameTr: 'Yüzde Problemleri' },
  { id: topicId('kpss', 'math', 'oran-oranti'), examType: 'kpss', subject: 'math', nameTr: 'Oran Orantı' },
  { id: topicId('kpss', 'math', 'problemler'), examType: 'kpss', subject: 'math', nameTr: 'Problemler' },
  { id: topicId('kpss', 'math', 'geometri-temel'), examType: 'kpss', subject: 'math', nameTr: 'Temel Geometri (metin)' },
  { id: topicId('kpss', 'math', 'veri'), examType: 'kpss', subject: 'math', nameTr: 'Tablo / Grafik' },
  { id: topicId('kpss', 'turkish', 'dilbilgisi'), examType: 'kpss', subject: 'turkish', nameTr: 'Dil Bilgisi' },
  { id: topicId('kpss', 'turkish', 'anlam'), examType: 'kpss', subject: 'turkish', nameTr: 'Anlam Bilgisi' },
  { id: topicId('kpss', 'turkish', 'paragraf'), examType: 'kpss', subject: 'turkish', nameTr: 'Paragraf' },
];
