import type { Topic } from './topics';
import { topicId } from './topics';

/**
 * YGS ürün etiketi = YKS TYT/AYT hattı (eski LYS alanları AYT ile eşlenir).
 * Telifli soru yok — konu başlıkları.
 */
export const YGS_TOPICS: Topic[] = [
  // TYT Türkçe / AYT edebiyat iskeleti
  { id: topicId('ygs', 'turkish', 'paragraf'), examType: 'ygs', subject: 'turkish', nameTr: 'Paragraf (TYT)' },
  { id: topicId('ygs', 'turkish', 'anlam'), examType: 'ygs', subject: 'turkish', nameTr: 'Anlam Bilgisi' },
  { id: topicId('ygs', 'turkish', 'dilbilgisi'), examType: 'ygs', subject: 'turkish', nameTr: 'Dil Bilgisi' },
  { id: topicId('ygs', 'literature', 'siir'), examType: 'ygs', subject: 'literature', nameTr: 'Şiir Bilgisi (AYT)' },
  { id: topicId('ygs', 'literature', 'nesir'), examType: 'ygs', subject: 'literature', nameTr: 'Nesir / Edebiyat Tarihi' },
  // Matematik TYT+AYT
  { id: topicId('ygs', 'math', 'temel-kavramlar'), examType: 'ygs', subject: 'math', nameTr: 'Temel Kavramlar' },
  { id: topicId('ygs', 'math', 'sayilar'), examType: 'ygs', subject: 'math', nameTr: 'Sayılar' },
  { id: topicId('ygs', 'math', 'bolunebilme'), examType: 'ygs', subject: 'math', nameTr: 'Bölünebilme' },
  { id: topicId('ygs', 'math', 'faktoriyel'), examType: 'ygs', subject: 'math', nameTr: 'Faktöriyel' },
  { id: topicId('ygs', 'math', 'denklemler'), examType: 'ygs', subject: 'math', nameTr: 'Denklemler' },
  { id: topicId('ygs', 'math', 'esitsizlik'), examType: 'ygs', subject: 'math', nameTr: 'Eşitsizlikler' },
  { id: topicId('ygs', 'math', 'fonksiyonlar'), examType: 'ygs', subject: 'math', nameTr: 'Fonksiyonlar' },
  { id: topicId('ygs', 'math', 'trigonometri'), examType: 'ygs', subject: 'math', nameTr: 'Trigonometri' },
  { id: topicId('ygs', 'math', 'limit-turev'), examType: 'ygs', subject: 'math', nameTr: 'Limit / Türev (AYT)' },
  { id: topicId('ygs', 'math', 'integral'), examType: 'ygs', subject: 'math', nameTr: 'İntegral (AYT)' },
  // Fen
  { id: topicId('ygs', 'physics', 'hareket'), examType: 'ygs', subject: 'physics', nameTr: 'Hareket' },
  { id: topicId('ygs', 'physics', 'kuvvet'), examType: 'ygs', subject: 'physics', nameTr: 'Kuvvet ve Enerji' },
  { id: topicId('ygs', 'physics', 'elektrik'), examType: 'ygs', subject: 'physics', nameTr: 'Elektrik' },
  { id: topicId('ygs', 'chemistry', 'atom'), examType: 'ygs', subject: 'chemistry', nameTr: 'Atom ve Periyodik' },
  { id: topicId('ygs', 'chemistry', 'kimyasal-tepkimeler'), examType: 'ygs', subject: 'chemistry', nameTr: 'Kimyasal Tepkimeler' },
  { id: topicId('ygs', 'chemistry', 'asit-baz'), examType: 'ygs', subject: 'chemistry', nameTr: 'Asitler ve Bazlar' },
  { id: topicId('ygs', 'biology', 'hucre'), examType: 'ygs', subject: 'biology', nameTr: 'Hücre' },
  { id: topicId('ygs', 'biology', 'sistemler'), examType: 'ygs', subject: 'biology', nameTr: 'Sistemler' },
  { id: topicId('ygs', 'biology', 'ekoloji'), examType: 'ygs', subject: 'biology', nameTr: 'Ekoloji' },
  // Sosyal
  { id: topicId('ygs', 'history', 'osmanli'), examType: 'ygs', subject: 'history', nameTr: 'Osmanlı' },
  { id: topicId('ygs', 'history', 'inkilap'), examType: 'ygs', subject: 'history', nameTr: 'İnkılap Tarihi' },
  { id: topicId('ygs', 'history', 'cagdas'), examType: 'ygs', subject: 'history', nameTr: 'Çağdaş Türk ve Dünya' },
  { id: topicId('ygs', 'geography', 'fiziki'), examType: 'ygs', subject: 'geography', nameTr: 'Fiziki Coğrafya' },
  { id: topicId('ygs', 'geography', 'beseri'), examType: 'ygs', subject: 'geography', nameTr: 'Beşeri Coğrafya' },
  { id: topicId('ygs', 'geography', 'turkiye'), examType: 'ygs', subject: 'geography', nameTr: 'Türkiye Coğrafyası' },
  { id: topicId('ygs', 'philosophy', 'felsefe'), examType: 'ygs', subject: 'philosophy', nameTr: 'Felsefe' },
  { id: topicId('ygs', 'philosophy', 'mantik'), examType: 'ygs', subject: 'philosophy', nameTr: 'Mantık' },
  { id: topicId('ygs', 'religion', 'inanc-ibadet'), examType: 'ygs', subject: 'religion', nameTr: 'İnanç / İbadet' },
];
