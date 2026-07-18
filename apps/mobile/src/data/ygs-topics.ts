import type { Topic } from './topics';
import { topicId } from './topics';

/** YGS (üniversite hattı) matematik iskelet katalog. */
export const YGS_TOPICS: Topic[] = [
  { id: topicId('ygs', 'math', 'temel-kavramlar'), examType: 'ygs', subject: 'math', nameTr: 'Temel Kavramlar' },
  { id: topicId('ygs', 'math', 'sayilar'), examType: 'ygs', subject: 'math', nameTr: 'Sayılar' },
  { id: topicId('ygs', 'math', 'bolunebilme'), examType: 'ygs', subject: 'math', nameTr: 'Bölünebilme' },
  { id: topicId('ygs', 'math', 'faktoriyel'), examType: 'ygs', subject: 'math', nameTr: 'Faktöriyel' },
  { id: topicId('ygs', 'math', 'denklemler'), examType: 'ygs', subject: 'math', nameTr: 'Denklemler' },
  { id: topicId('ygs', 'math', 'esitsizlik'), examType: 'ygs', subject: 'math', nameTr: 'Eşitsizlikler' },
  { id: topicId('ygs', 'math', 'fonksiyonlar'), examType: 'ygs', subject: 'math', nameTr: 'Fonksiyonlar' },
  { id: topicId('ygs', 'math', 'trigonometri'), examType: 'ygs', subject: 'math', nameTr: 'Trigonometri' },
  { id: topicId('ygs', 'turkish', 'anlam'), examType: 'ygs', subject: 'turkish', nameTr: 'Anlam Bilgisi' },
  { id: topicId('ygs', 'turkish', 'paragraf'), examType: 'ygs', subject: 'turkish', nameTr: 'Paragraf' },
];
