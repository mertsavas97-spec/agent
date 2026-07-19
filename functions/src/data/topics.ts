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
  // Türkçe
  { id: tid('lgs', 'turkish', 'anlam'), examType: 'lgs', subject: 'turkish', nameTr: 'Sözcükte Anlam' },
  { id: tid('lgs', 'turkish', 'cumlede-anlam'), examType: 'lgs', subject: 'turkish', nameTr: 'Cümlede Anlam' },
  { id: tid('lgs', 'turkish', 'paragraf'), examType: 'lgs', subject: 'turkish', nameTr: 'Paragraf' },
  { id: tid('lgs', 'turkish', 'dilbilgisi'), examType: 'lgs', subject: 'turkish', nameTr: 'Dil Bilgisi' },
  // Matematik
  { id: tid('lgs', 'math', 'kesirler'), examType: 'lgs', subject: 'math', nameTr: 'Kesirler' },
  { id: tid('lgs', 'math', 'uslu-sayilar'), examType: 'lgs', subject: 'math', nameTr: 'Üslü Sayılar' },
  { id: tid('lgs', 'math', 'koklu-sayilar'), examType: 'lgs', subject: 'math', nameTr: 'Köklü Sayılar' },
  { id: tid('lgs', 'math', 'oran-oranti'), examType: 'lgs', subject: 'math', nameTr: 'Oran Orantı' },
  { id: tid('lgs', 'math', 'yuzdeler'), examType: 'lgs', subject: 'math', nameTr: 'Yüzdeler' },
  { id: tid('lgs', 'math', 'denklemler'), examType: 'lgs', subject: 'math', nameTr: 'Denklemler' },
  { id: tid('lgs', 'math', 'olasilik'), examType: 'lgs', subject: 'math', nameTr: 'Olasılık' },
  { id: tid('lgs', 'math', 'veri-analiz'), examType: 'lgs', subject: 'math', nameTr: 'Veri Analizi' },
  { id: tid('lgs', 'math', 'ucgenler'), examType: 'lgs', subject: 'math', nameTr: 'Üçgenler' },
  // Fen
  { id: tid('lgs', 'science', 'basinc'), examType: 'lgs', subject: 'science', nameTr: 'Basınç' },
  { id: tid('lgs', 'science', 'madde'), examType: 'lgs', subject: 'science', nameTr: 'Madde ve Endüstri' },
  { id: tid('lgs', 'science', 'enerji'), examType: 'lgs', subject: 'science', nameTr: 'Enerji Dönüşümleri' },
  { id: tid('lgs', 'science', 'elektrik'), examType: 'lgs', subject: 'science', nameTr: 'Elektrik' },
  { id: tid('lgs', 'science', 'dna'), examType: 'lgs', subject: 'science', nameTr: 'DNA ve Genetik' },
  // İnkılap
  { id: tid('lgs', 'history', 'milli-mucadele'), examType: 'lgs', subject: 'history', nameTr: 'Milli Mücadele' },
  { id: tid('lgs', 'history', 'inkilaplar'), examType: 'lgs', subject: 'history', nameTr: 'Atatürk İlke ve İnkılapları' },
  { id: tid('lgs', 'history', 'dis-politika'), examType: 'lgs', subject: 'history', nameTr: 'Dış Politika' },
  // Din
  { id: tid('lgs', 'religion', 'inanc'), examType: 'lgs', subject: 'religion', nameTr: 'İnanç' },
  { id: tid('lgs', 'religion', 'ibadet'), examType: 'lgs', subject: 'religion', nameTr: 'İbadet' },
  // İngilizce
  { id: tid('lgs', 'english', 'vocabulary'), examType: 'lgs', subject: 'english', nameTr: 'Kelime Bilgisi' },
  { id: tid('lgs', 'english', 'reading'), examType: 'lgs', subject: 'english', nameTr: 'Okuma / Diyalog' },
];

export const YGS_TOPICS: Topic[] = [
  // TYT Türkçe / AYT edebiyat iskeleti
  { id: tid('ygs', 'turkish', 'paragraf'), examType: 'ygs', subject: 'turkish', nameTr: 'Paragraf (TYT)' },
  { id: tid('ygs', 'turkish', 'anlam'), examType: 'ygs', subject: 'turkish', nameTr: 'Anlam Bilgisi' },
  { id: tid('ygs', 'turkish', 'dilbilgisi'), examType: 'ygs', subject: 'turkish', nameTr: 'Dil Bilgisi' },
  { id: tid('ygs', 'literature', 'siir'), examType: 'ygs', subject: 'literature', nameTr: 'Şiir Bilgisi (AYT)' },
  { id: tid('ygs', 'literature', 'nesir'), examType: 'ygs', subject: 'literature', nameTr: 'Nesir / Edebiyat Tarihi' },
  // Matematik TYT+AYT
  { id: tid('ygs', 'math', 'temel-kavramlar'), examType: 'ygs', subject: 'math', nameTr: 'Temel Kavramlar' },
  { id: tid('ygs', 'math', 'sayilar'), examType: 'ygs', subject: 'math', nameTr: 'Sayılar' },
  { id: tid('ygs', 'math', 'bolunebilme'), examType: 'ygs', subject: 'math', nameTr: 'Bölünebilme' },
  { id: tid('ygs', 'math', 'faktoriyel'), examType: 'ygs', subject: 'math', nameTr: 'Faktöriyel' },
  { id: tid('ygs', 'math', 'denklemler'), examType: 'ygs', subject: 'math', nameTr: 'Denklemler' },
  { id: tid('ygs', 'math', 'esitsizlik'), examType: 'ygs', subject: 'math', nameTr: 'Eşitsizlikler' },
  { id: tid('ygs', 'math', 'fonksiyonlar'), examType: 'ygs', subject: 'math', nameTr: 'Fonksiyonlar' },
  { id: tid('ygs', 'math', 'trigonometri'), examType: 'ygs', subject: 'math', nameTr: 'Trigonometri' },
  { id: tid('ygs', 'math', 'limit-turev'), examType: 'ygs', subject: 'math', nameTr: 'Limit / Türev (AYT)' },
  { id: tid('ygs', 'math', 'integral'), examType: 'ygs', subject: 'math', nameTr: 'İntegral (AYT)' },
  // Fen
  { id: tid('ygs', 'physics', 'hareket'), examType: 'ygs', subject: 'physics', nameTr: 'Hareket' },
  { id: tid('ygs', 'physics', 'kuvvet'), examType: 'ygs', subject: 'physics', nameTr: 'Kuvvet ve Enerji' },
  { id: tid('ygs', 'physics', 'elektrik'), examType: 'ygs', subject: 'physics', nameTr: 'Elektrik' },
  { id: tid('ygs', 'chemistry', 'atom'), examType: 'ygs', subject: 'chemistry', nameTr: 'Atom ve Periyodik' },
  { id: tid('ygs', 'chemistry', 'kimyasal-tepkimeler'), examType: 'ygs', subject: 'chemistry', nameTr: 'Kimyasal Tepkimeler' },
  { id: tid('ygs', 'chemistry', 'asit-baz'), examType: 'ygs', subject: 'chemistry', nameTr: 'Asitler ve Bazlar' },
  { id: tid('ygs', 'biology', 'hucre'), examType: 'ygs', subject: 'biology', nameTr: 'Hücre' },
  { id: tid('ygs', 'biology', 'sistemler'), examType: 'ygs', subject: 'biology', nameTr: 'Sistemler' },
  { id: tid('ygs', 'biology', 'ekoloji'), examType: 'ygs', subject: 'biology', nameTr: 'Ekoloji' },
  // Sosyal
  { id: tid('ygs', 'history', 'osmanli'), examType: 'ygs', subject: 'history', nameTr: 'Osmanlı' },
  { id: tid('ygs', 'history', 'inkilap'), examType: 'ygs', subject: 'history', nameTr: 'İnkılap Tarihi' },
  { id: tid('ygs', 'history', 'cagdas'), examType: 'ygs', subject: 'history', nameTr: 'Çağdaş Türk ve Dünya' },
  { id: tid('ygs', 'geography', 'fiziki'), examType: 'ygs', subject: 'geography', nameTr: 'Fiziki Coğrafya' },
  { id: tid('ygs', 'geography', 'beseri'), examType: 'ygs', subject: 'geography', nameTr: 'Beşeri Coğrafya' },
  { id: tid('ygs', 'geography', 'turkiye'), examType: 'ygs', subject: 'geography', nameTr: 'Türkiye Coğrafyası' },
  { id: tid('ygs', 'philosophy', 'felsefe'), examType: 'ygs', subject: 'philosophy', nameTr: 'Felsefe' },
  { id: tid('ygs', 'philosophy', 'mantik'), examType: 'ygs', subject: 'philosophy', nameTr: 'Mantık' },
  { id: tid('ygs', 'religion', 'inanc-ibadet'), examType: 'ygs', subject: 'religion', nameTr: 'İnanç / İbadet' },
];

export const KPSS_TOPICS: Topic[] = [
  // GY Türkçe
  { id: tid('kpss', 'turkish', 'paragraf'), examType: 'kpss', subject: 'turkish', nameTr: 'Paragraf' },
  { id: tid('kpss', 'turkish', 'anlam'), examType: 'kpss', subject: 'turkish', nameTr: 'Anlam Bilgisi' },
  { id: tid('kpss', 'turkish', 'dilbilgisi'), examType: 'kpss', subject: 'turkish', nameTr: 'Dil Bilgisi' },
  { id: tid('kpss', 'turkish', 'sozel-mantik'), examType: 'kpss', subject: 'turkish', nameTr: 'Sözel Mantık' },
  // GY Matematik
  { id: tid('kpss', 'math', 'temel-islemler'), examType: 'kpss', subject: 'math', nameTr: 'Temel İşlemler' },
  { id: tid('kpss', 'math', 'kesirler'), examType: 'kpss', subject: 'math', nameTr: 'Kesirler' },
  { id: tid('kpss', 'math', 'yuzde'), examType: 'kpss', subject: 'math', nameTr: 'Yüzde Problemleri' },
  { id: tid('kpss', 'math', 'oran-oranti'), examType: 'kpss', subject: 'math', nameTr: 'Oran Orantı' },
  { id: tid('kpss', 'math', 'problemler'), examType: 'kpss', subject: 'math', nameTr: 'Problemler' },
  { id: tid('kpss', 'math', 'sayisal-mantik'), examType: 'kpss', subject: 'math', nameTr: 'Sayısal Mantık' },
  { id: tid('kpss', 'math', 'veri'), examType: 'kpss', subject: 'math', nameTr: 'Tablo / Grafik' },
  // GY Geometri (ayrı ders)
  { id: tid('kpss', 'geometry', 'ucgen'), examType: 'kpss', subject: 'geometry', nameTr: 'Üçgenler' },
  { id: tid('kpss', 'geometry', 'dortgen'), examType: 'kpss', subject: 'geometry', nameTr: 'Dörtgenler' },
  { id: tid('kpss', 'geometry', 'cember'), examType: 'kpss', subject: 'geometry', nameTr: 'Çember / Daire' },
  // GK
  { id: tid('kpss', 'history', 'osmanli'), examType: 'kpss', subject: 'history', nameTr: 'Osmanlı Tarihi' },
  { id: tid('kpss', 'history', 'inkilap'), examType: 'kpss', subject: 'history', nameTr: 'İnkılap Tarihi' },
  { id: tid('kpss', 'history', 'cumhuriyet'), examType: 'kpss', subject: 'history', nameTr: 'Cumhuriyet Dönemi' },
  { id: tid('kpss', 'geography', 'turkiye'), examType: 'kpss', subject: 'geography', nameTr: 'Türkiye Coğrafyası' },
  { id: tid('kpss', 'geography', 'nufus'), examType: 'kpss', subject: 'geography', nameTr: 'Nüfus ve Yerleşme' },
  { id: tid('kpss', 'geography', 'ekonomi'), examType: 'kpss', subject: 'geography', nameTr: 'Ekonomik Coğrafya' },
  { id: tid('kpss', 'civics', 'anayasa'), examType: 'kpss', subject: 'civics', nameTr: 'Anayasa Temelleri' },
  { id: tid('kpss', 'civics', 'temel-haklar'), examType: 'kpss', subject: 'civics', nameTr: 'Temel Hak ve Ödevler' },
  { id: tid('kpss', 'current', 'gundem'), examType: 'kpss', subject: 'current', nameTr: 'Gündem / Kurumlar' },
];

export function topicsForExam(exam: ExamType): Topic[] {
  if (exam === 'lgs') return LGS_TOPICS;
  if (exam === 'ygs') return YGS_TOPICS;
  return KPSS_TOPICS;
}

export const ALL_TOPICS: Topic[] = [...LGS_TOPICS, ...YGS_TOPICS, ...KPSS_TOPICS];

export function findTopic(topicId: string): Topic | undefined {
  return ALL_TOPICS.find((t) => t.id === topicId);
}

/** Clamp model topicId to catalog for exam; null if unknown. */
export function clampTopicId(exam: ExamType, topicId: string | null | undefined): string | null {
  if (!topicId) return null;
  const hit = ALL_TOPICS.find((t) => t.id === topicId && t.examType === exam);
  return hit ? hit.id : null;
}
