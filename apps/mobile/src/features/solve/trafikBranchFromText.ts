/**
 * Infer Ehliyet branş + topic from question/OCR text (not from generic UI tips).
 */
import type { Subject } from '@/src/lib/api/types';

export type TrafikBranchGuess = {
  subject: Extract<Subject, 'traffic' | 'vehicle' | 'firstaid'>;
  topicId: string;
};

/** Known offline fallback titles — never use these bodies for branş remapping. */
export const GENERIC_TRAFIK_FALLBACK_TITLES = [
  '1. kökü ayır',
  '2. sahneyi kur',
  '3. güvenliği seç',
  '1. kuralı bul',
  '1. sistemi tanı',
  '2. parçaları sırayla düşün',
  '3. şıkları ele',
  '1. öncelik',
  '2. abc',
  '3. 112',
  '1. dersi onayla',
  '2. soruyu oku',
  '3. tekrar dene',
];

export function isGenericTrafikFallbackStep(title: string, body: string): boolean {
  const t = title.toLocaleLowerCase('tr-TR').trim();
  if (GENERIC_TRAFIK_FALLBACK_TITLES.some((g) => t === g || t.startsWith(g))) {
    return true;
  }
  // Heuristic: instructional offline copy
  if (
    /ilk yardım mı isteniyor|genel hatırlatma|otomatik çözüme ulaşılamadı|branşa uygun hatırlatma|fotoğrafı daha keskin çek/i.test(
      body,
    )
  ) {
    return true;
  }
  return false;
}

export function classifyTrafikBranchFromText(raw: string): TrafikBranchGuess | null {
  const blob = String(raw || '').toLocaleLowerCase('tr-TR');
  if (!blob.trim()) return null;

  if (/şaft|saft|diferansiyel|güç aktarma|aktarma organ|\baks\b/.test(blob)) {
    return { subject: 'vehicle', topicId: 'trafik-vehicle-motor' };
  }
  if (/\babs\b|hava yastığı|emniyet kemeri|esp\b/.test(blob)) {
    return { subject: 'vehicle', topicId: 'trafik-vehicle-guvenlik' };
  }
  if (/fren|süspansiyon|amortisör/.test(blob)) {
    return { subject: 'vehicle', topicId: 'trafik-vehicle-fren-suspansiyon' };
  }
  if (/akü|far|silecek|aydınlatma/.test(blob)) {
    return { subject: 'vehicle', topicId: 'trafik-vehicle-elektrik' };
  }

  // Strong first-aid only — avoid matching “veya ilk yardım mı” instructional copy alone
  if (
    (/hava yolu|kazazede|bilinç kontrol|kalp masajı|kanama|şok pozisyon/.test(blob) ||
      (/\bilk yardım\b/.test(blob) && /abc|solunum|dolaşım|bilinç/.test(blob))) &&
    !/güç aktarma|şaft|diferansiyel/.test(blob)
  ) {
    if (/kanama|şok/.test(blob)) {
      return { subject: 'firstaid', topicId: 'trafik-firstaid-kanama' };
    }
    if (/kırık|yanık/.test(blob)) {
      return { subject: 'firstaid', topicId: 'trafik-firstaid-kirik-yanik' };
    }
    return { subject: 'firstaid', topicId: 'trafik-firstaid-abc' };
  }

  if (
    /kırmızı|sarı|ışıklı|şerit|kavşak|azami hız|hazırlanmalı|trafik işaret|sollama|park yasağı/.test(
      blob,
    )
  ) {
    return {
      subject: 'traffic',
      topicId: /hız|50 km|mesafe|takip/.test(blob)
        ? 'trafik-traffic-hiz-mesafe'
        : /kavşak|geçiş üstün/.test(blob)
          ? 'trafik-traffic-kavsak'
          : 'trafik-traffic-kurallar',
    };
  }

  return null;
}
