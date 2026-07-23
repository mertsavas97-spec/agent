import { ADS_LIMITS } from '@/src/features/ads/policy';

/** Abuse / UX cap — same for free and Premium. */
export const MULTI_BATCH_MAX = ADS_LIMITS.multiBatchMax;

export function clampBatchSize(count: number): number {
  return Math.max(0, Math.min(MULTI_BATCH_MAX, Math.floor(count)));
}

export function multiBatchUserCopy(): {
  title: string;
  freeBody: string;
  premiumBody: string;
} {
  return {
    title: `Çoklu soru (en fazla ${MULTI_BATCH_MAX})`,
    freeBody: `Galeriden en fazla ${MULTI_BATCH_MAX} soru seç; hepsi seçili moda ait olmalı. Ücretsiz planda her çoklu açılışta 1 reklam izlersin; reklam tamamlanınca +1 çözüm hakkı da eklenir. Her soru günlük hakkından düşer.`,
    premiumBody: `Galeriden en fazla ${MULTI_BATCH_MAX} soru seç; hepsi seçili moda ait olmalı. Reklam yok; ilk hazır cevap hemen açılır, diğerleri arka planda yüklenir.`,
  };
}
