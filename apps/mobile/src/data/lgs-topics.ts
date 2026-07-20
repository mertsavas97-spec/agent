import type { Topic } from './topics';
import { topicId } from './topics';

/** LGS — MEB 8. sınıf oturum dersleri (2020–2026). */
export const LGS_TOPICS: Topic[] = [
  // Türkçe
  { id: topicId('lgs', 'turkish', 'anlam'), examType: 'lgs', subject: 'turkish', nameTr: 'Sözcükte Anlam' },
  { id: topicId('lgs', 'turkish', 'cumlede-anlam'), examType: 'lgs', subject: 'turkish', nameTr: 'Cümlede Anlam' },
  { id: topicId('lgs', 'turkish', 'paragraf'), examType: 'lgs', subject: 'turkish', nameTr: 'Paragraf' },
  { id: topicId('lgs', 'turkish', 'dilbilgisi'), examType: 'lgs', subject: 'turkish', nameTr: 'Dil Bilgisi' },
  // Matematik
  { id: topicId('lgs', 'math', 'kesirler'), examType: 'lgs', subject: 'math', nameTr: 'Kesirler' },
  { id: topicId('lgs', 'math', 'uslu-sayilar'), examType: 'lgs', subject: 'math', nameTr: 'Üslü Sayılar' },
  { id: topicId('lgs', 'math', 'koklu-sayilar'), examType: 'lgs', subject: 'math', nameTr: 'Köklü Sayılar' },
  { id: topicId('lgs', 'math', 'oran-oranti'), examType: 'lgs', subject: 'math', nameTr: 'Oran Orantı' },
  { id: topicId('lgs', 'math', 'yuzdeler'), examType: 'lgs', subject: 'math', nameTr: 'Yüzdeler' },
  { id: topicId('lgs', 'math', 'denklemler'), examType: 'lgs', subject: 'math', nameTr: 'Denklemler' },
  { id: topicId('lgs', 'math', 'olasilik'), examType: 'lgs', subject: 'math', nameTr: 'Olasılık' },
  { id: topicId('lgs', 'math', 'veri-analiz'), examType: 'lgs', subject: 'math', nameTr: 'Veri Analizi' },
  { id: topicId('lgs', 'math', 'ucgenler'), examType: 'lgs', subject: 'math', nameTr: 'Üçgenler' },
  // Fen
  { id: topicId('lgs', 'science', 'basinc'), examType: 'lgs', subject: 'science', nameTr: 'Basınç' },
  { id: topicId('lgs', 'science', 'madde'), examType: 'lgs', subject: 'science', nameTr: 'Madde ve Endüstri' },
  { id: topicId('lgs', 'science', 'enerji'), examType: 'lgs', subject: 'science', nameTr: 'Enerji Dönüşümleri' },
  { id: topicId('lgs', 'science', 'elektrik'), examType: 'lgs', subject: 'science', nameTr: 'Elektrik' },
  { id: topicId('lgs', 'science', 'dna'), examType: 'lgs', subject: 'science', nameTr: 'DNA ve Genetik' },
  // İnkılap
  { id: topicId('lgs', 'history', 'milli-mucadele'), examType: 'lgs', subject: 'history', nameTr: 'Milli Mücadele' },
  { id: topicId('lgs', 'history', 'inkilaplar'), examType: 'lgs', subject: 'history', nameTr: 'Atatürk İlke ve İnkılapları' },
  { id: topicId('lgs', 'history', 'dis-politika'), examType: 'lgs', subject: 'history', nameTr: 'Dış Politika' },
  // Din
  { id: topicId('lgs', 'religion', 'inanc'), examType: 'lgs', subject: 'religion', nameTr: 'İnanç' },
  { id: topicId('lgs', 'religion', 'ibadet'), examType: 'lgs', subject: 'religion', nameTr: 'İbadet' },
  // İngilizce
  { id: topicId('lgs', 'english', 'vocabulary'), examType: 'lgs', subject: 'english', nameTr: 'Kelime Bilgisi' },
  { id: topicId('lgs', 'english', 'reading'), examType: 'lgs', subject: 'english', nameTr: 'Okuma / Diyalog' },
];
