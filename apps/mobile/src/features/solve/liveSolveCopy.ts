/**
 * Live copy for AnalyzingView — tied to real client pipeline stages.
 * Keep wording honest (no “%100 doğru”); guardian-safe.
 */

import type { AnalyzeStepId } from './analyzeSteps';

export type LiveSolvePhase =
  | 'preparing'
  | 'upload'
  | 'ocr'
  | 'moderate'
  | 'solving'
  | 'finishing';

export type LiveSolveCopy = {
  phase: LiveSolvePhase;
  /** Maps to coarse progress checklist */
  step: AnalyzeStepId;
  headline: string;
  detail: string;
  tip: string;
};

const COPY: Record<LiveSolvePhase, Omit<LiveSolveCopy, 'phase'>> = {
  preparing: {
    step: 'upload',
    headline: 'Hazırlanıyor…',
    detail: 'Sınav paketini ve oturumu kontrol ediyorum.',
    tip: 'LGS, YGS, KPSS veya Ehliyet — seçili paket sabit kalır.',
  },
  upload: {
    step: 'upload',
    headline: 'Fotoğraf yolda…',
    detail: 'Görsel güvenli kanala iletiliyor.',
    tip: 'Net kadraj = daha hızlı okuma. Soru ve şıklar tam görünsün.',
  },
  ocr: {
    step: 'upload',
    headline: 'Metin okunuyor…',
    detail: 'Fotoğraftaki soru satırlarını ayıklıyorum.',
    tip: 'El yazısı veya bulanık ışık okumayı yavaşlatabilir.',
  },
  moderate: {
    step: 'moderate',
    headline: 'Güvenlik bakışı…',
    detail: 'Görselin soru için uygun olup olmadığına bakıyorum.',
    tip: 'Uygunsuz içerikte çözüm üretmem — dürüstçe söylerim.',
  },
  solving: {
    step: 'solve',
    headline: 'Adım adım çözüyorum…',
    detail: 'Cevap ve kısa açıklama hazırlanıyor.',
    tip: 'Birkaç saniye sürebilir — sonuç ekranı hemen ardından açılır.',
  },
  finishing: {
    step: 'solve',
    headline: 'Son dokunuş…',
    detail: 'Çözümü ekrana getiriyorum.',
    tip: 'Hazır olunca adımları ve cevabı birlikte göreceksin.',
  },
};

export function liveCopyFor(phase: LiveSolvePhase): LiveSolveCopy {
  return { phase, ...COPY[phase] };
}

/** Progress target 0–1 for live phase (monotonic). */
export function progressForLivePhase(phase: LiveSolvePhase): number {
  switch (phase) {
    case 'preparing':
      return 0.1;
    case 'upload':
      return 0.22;
    case 'ocr':
      return 0.38;
    case 'moderate':
      return 0.52;
    case 'solving':
      return 0.86;
    case 'finishing':
      return 0.96;
    default:
      return 0.1;
  }
}
