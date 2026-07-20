import type { Topic } from './topics';
import { topicId } from './topics';

/**
 * Trafik / ehliyet (MTS) paket — kurallar, işaretler, araç tekniği, ilk yardım.
 * Telifsiz özgün katalog; resmi kitapçık kopyası değil.
 */
export const TRAFIK_TOPICS: Topic[] = [
  // Trafik ve çevre
  {
    id: topicId('trafik', 'traffic', 'kurallar'),
    examType: 'trafik',
    subject: 'traffic',
    nameTr: 'Trafik Kuralları',
  },
  {
    id: topicId('trafik', 'traffic', 'hiz-mesafe'),
    examType: 'trafik',
    subject: 'traffic',
    nameTr: 'Hız ve Mesafe',
  },
  {
    id: topicId('trafik', 'traffic', 'kavsak'),
    examType: 'trafik',
    subject: 'traffic',
    nameTr: 'Kavşak ve Geçiş Üstünlüğü',
  },
  {
    id: topicId('trafik', 'traffic', 'cevre'),
    examType: 'trafik',
    subject: 'traffic',
    nameTr: 'Trafik ve Çevre',
  },
  // İşaretler
  {
    id: topicId('trafik', 'traffic', 'isaretler-uyari'),
    examType: 'trafik',
    subject: 'traffic',
    nameTr: 'Uyarı İşaretleri',
  },
  {
    id: topicId('trafik', 'traffic', 'isaretler-yasak'),
    examType: 'trafik',
    subject: 'traffic',
    nameTr: 'Yasaklama İşaretleri',
  },
  {
    id: topicId('trafik', 'traffic', 'isaretler-bilgi'),
    examType: 'trafik',
    subject: 'traffic',
    nameTr: 'Bilgi ve Yol Çizgileri',
  },
  // Araç tekniği
  {
    id: topicId('trafik', 'vehicle', 'motor'),
    examType: 'trafik',
    subject: 'vehicle',
    nameTr: 'Motor ve Güç Aktarma',
  },
  {
    id: topicId('trafik', 'vehicle', 'fren-suspansiyon'),
    examType: 'trafik',
    subject: 'vehicle',
    nameTr: 'Fren ve Süspansiyon',
  },
  {
    id: topicId('trafik', 'vehicle', 'elektrik'),
    examType: 'trafik',
    subject: 'vehicle',
    nameTr: 'Elektrik ve Aydınlatma',
  },
  {
    id: topicId('trafik', 'vehicle', 'guvenlik'),
    examType: 'trafik',
    subject: 'vehicle',
    nameTr: 'Araç Güvenlik Sistemleri',
  },
  // İlk yardım
  {
    id: topicId('trafik', 'firstaid', 'temel'),
    examType: 'trafik',
    subject: 'firstaid',
    nameTr: 'Temel İlk Yardım',
  },
  {
    id: topicId('trafik', 'firstaid', 'kanama'),
    examType: 'trafik',
    subject: 'firstaid',
    nameTr: 'Kanama ve Şok',
  },
  {
    id: topicId('trafik', 'firstaid', 'kirik-yanik'),
    examType: 'trafik',
    subject: 'firstaid',
    nameTr: 'Kırık / Yanık',
  },
  {
    id: topicId('trafik', 'firstaid', 'abc'),
    examType: 'trafik',
    subject: 'firstaid',
    nameTr: 'ABC ve Bilinç Kontrolü',
  },
];
