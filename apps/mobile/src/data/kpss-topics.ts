import type { Topic } from './topics';
import { topicId } from './topics';

/** KPSS GY–GK çekirdek (lisans tipi dağılım referansı). */
export const KPSS_TOPICS: Topic[] = [
  // GY Türkçe
  { id: topicId('kpss', 'turkish', 'paragraf'), examType: 'kpss', subject: 'turkish', nameTr: 'Paragraf' },
  { id: topicId('kpss', 'turkish', 'anlam'), examType: 'kpss', subject: 'turkish', nameTr: 'Anlam Bilgisi' },
  { id: topicId('kpss', 'turkish', 'dilbilgisi'), examType: 'kpss', subject: 'turkish', nameTr: 'Dil Bilgisi' },
  { id: topicId('kpss', 'turkish', 'sozel-mantik'), examType: 'kpss', subject: 'turkish', nameTr: 'Sözel Mantık' },
  // GY Matematik
  { id: topicId('kpss', 'math', 'temel-islemler'), examType: 'kpss', subject: 'math', nameTr: 'Temel İşlemler' },
  { id: topicId('kpss', 'math', 'kesirler'), examType: 'kpss', subject: 'math', nameTr: 'Kesirler' },
  { id: topicId('kpss', 'math', 'yuzde'), examType: 'kpss', subject: 'math', nameTr: 'Yüzde Problemleri' },
  { id: topicId('kpss', 'math', 'oran-oranti'), examType: 'kpss', subject: 'math', nameTr: 'Oran Orantı' },
  { id: topicId('kpss', 'math', 'problemler'), examType: 'kpss', subject: 'math', nameTr: 'Problemler' },
  { id: topicId('kpss', 'math', 'sayisal-mantik'), examType: 'kpss', subject: 'math', nameTr: 'Sayısal Mantık' },
  { id: topicId('kpss', 'math', 'veri'), examType: 'kpss', subject: 'math', nameTr: 'Tablo / Grafik' },
  // GY Geometri (ayrı ders)
  { id: topicId('kpss', 'geometry', 'ucgen'), examType: 'kpss', subject: 'geometry', nameTr: 'Üçgenler' },
  { id: topicId('kpss', 'geometry', 'dortgen'), examType: 'kpss', subject: 'geometry', nameTr: 'Dörtgenler' },
  { id: topicId('kpss', 'geometry', 'cember'), examType: 'kpss', subject: 'geometry', nameTr: 'Çember / Daire' },
  // GK
  { id: topicId('kpss', 'history', 'osmanli'), examType: 'kpss', subject: 'history', nameTr: 'Osmanlı Tarihi' },
  { id: topicId('kpss', 'history', 'inkilap'), examType: 'kpss', subject: 'history', nameTr: 'İnkılap Tarihi' },
  { id: topicId('kpss', 'history', 'cumhuriyet'), examType: 'kpss', subject: 'history', nameTr: 'Cumhuriyet Dönemi' },
  { id: topicId('kpss', 'geography', 'turkiye'), examType: 'kpss', subject: 'geography', nameTr: 'Türkiye Coğrafyası' },
  { id: topicId('kpss', 'geography', 'nufus'), examType: 'kpss', subject: 'geography', nameTr: 'Nüfus ve Yerleşme' },
  { id: topicId('kpss', 'geography', 'ekonomi'), examType: 'kpss', subject: 'geography', nameTr: 'Ekonomik Coğrafya' },
  { id: topicId('kpss', 'civics', 'anayasa'), examType: 'kpss', subject: 'civics', nameTr: 'Anayasa Temelleri' },
  { id: topicId('kpss', 'civics', 'temel-haklar'), examType: 'kpss', subject: 'civics', nameTr: 'Temel Hak ve Ödevler' },
  { id: topicId('kpss', 'current', 'gundem'), examType: 'kpss', subject: 'current', nameTr: 'Gündem / Kurumlar' },
];
