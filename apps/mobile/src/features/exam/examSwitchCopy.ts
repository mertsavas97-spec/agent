import { EXAM_LABEL } from './examLabels';
import type { ExamType } from '@/src/lib/api/types';

/** Confirm dialog before rewarded ad — mirrors multi-batch UX. */
export function examSwitchUserCopy(next: ExamType): {
  title: string;
  freeBody: string;
  premiumBody: string;
  confirmFree: string;
  confirmPremium: string;
} {
  const label = EXAM_LABEL[next];
  return {
    title: `Mod: ${label}`,
    freeBody: `${label} moduna geçmek için kısa bir ödüllü reklam izlemen gerekir. Reklamı tamamlayınca mod değişir.`,
    premiumBody: `${label} moduna geç. Premium’da reklam yok.`,
    confirmFree: 'Reklam izle ve geç',
    confirmPremium: 'Modu değiştir',
  };
}
