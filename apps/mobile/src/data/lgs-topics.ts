import type { Topic } from './topics';
import { topicId } from './topics';

/** LGS matematik öncelikli iskelet katalog — uzman doğrulaması sonraki tur. */
export const LGS_TOPICS: Topic[] = [
  { id: topicId('lgs', 'math', 'kesirler'), examType: 'lgs', subject: 'math', nameTr: 'Kesirler' },
  { id: topicId('lgs', 'math', 'uslu-sayilar'), examType: 'lgs', subject: 'math', nameTr: 'Üslü Sayılar' },
  { id: topicId('lgs', 'math', 'koklu-sayilar'), examType: 'lgs', subject: 'math', nameTr: 'Köklü Sayılar' },
  { id: topicId('lgs', 'math', 'oran-oranti'), examType: 'lgs', subject: 'math', nameTr: 'Oran Orantı' },
  { id: topicId('lgs', 'math', 'yuzdeler'), examType: 'lgs', subject: 'math', nameTr: 'Yüzdeler' },
  { id: topicId('lgs', 'math', 'denklemler'), examType: 'lgs', subject: 'math', nameTr: 'Denklemler' },
  { id: topicId('lgs', 'math', 'olasilik'), examType: 'lgs', subject: 'math', nameTr: 'Olasılık' },
  { id: topicId('lgs', 'math', 'veri-analiz'), examType: 'lgs', subject: 'math', nameTr: 'Veri Analizi' },
  { id: topicId('lgs', 'turkish', 'anlam'), examType: 'lgs', subject: 'turkish', nameTr: 'Sözcükte Anlam' },
  { id: topicId('lgs', 'turkish', 'paragraf'), examType: 'lgs', subject: 'turkish', nameTr: 'Paragraf' },
];
