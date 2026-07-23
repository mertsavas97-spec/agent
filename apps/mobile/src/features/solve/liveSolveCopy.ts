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

const PHASE_RANK: Record<LiveSolvePhase, number> = {
  preparing: 0,
  upload: 1,
  ocr: 2,
  moderate: 3,
  solving: 4,
  finishing: 5,
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

export function phaseRank(phase: LiveSolvePhase): number {
  return PHASE_RANK[phase];
}

/** Never regress the live pipeline UI (proxy onStage can fire out of order). */
export function advanceLiveCopy(
  current: LiveSolveCopy | null | undefined,
  next: LiveSolvePhase,
): LiveSolveCopy {
  if (!current || phaseRank(next) >= phaseRank(current.phase)) {
    return liveCopyFor(next);
  }
  return current;
}

/** Short status under the detail — matches the active pipeline beat. */
export function statusLabelForPhase(phase: LiveSolvePhase): string {
  switch (phase) {
    case 'preparing':
      return 'Hazırlanıyor';
    case 'upload':
      return 'Fotoğraf yolda';
    case 'ocr':
      return 'Metin okunuyor';
    case 'moderate':
      return 'Güvenli mi bakıyorum';
    case 'solving':
      return 'Adım adım çözüyorum';
    case 'finishing':
      return 'Son dokunuş';
    default:
      return 'Sorun analiz ediliyor…';
  }
}

/** Checklist row label — phase-aware so OCR doesn’t stay on “Fotoğraf yolda”. */
export function checklistLabelFor(
  stepId: AnalyzeStepId,
  phase: LiveSolvePhase,
  completed: boolean,
): string {
  if (completed && stepId === 'upload') return 'Fotoğraf yüklendi';
  if (completed && stepId === 'moderate') return 'Güvenlik tamam';
  if (!completed && stepId === 'upload' && phase === 'ocr') return 'Metin okunuyor';
  if (stepId === 'upload') return 'Fotoğraf yolda';
  if (stepId === 'moderate') return 'Güvenli mi bakıyorum';
  return 'Adım adım çözüyorum';
}

/**
 * Progress target 0–1 for live phase (monotonic).
 * OCR sits mid-bar; AnalyzingView soft-crawls while waiting so we never freeze.
 */
export function progressForLivePhase(phase: LiveSolvePhase): number {
  switch (phase) {
    case 'preparing':
      return 0.12;
    case 'upload':
      return 0.24;
    case 'ocr':
      return 0.42;
    case 'moderate':
      return 0.58;
    case 'solving':
      return 0.74;
    case 'finishing':
      return 0.96;
    default:
      return 0.12;
  }
}

/** Soft crawl while a network/OCR beat is in flight. */
export function shouldCrawlProgress(phase: LiveSolvePhase): boolean {
  return (
    phase === 'ocr' ||
    phase === 'moderate' ||
    phase === 'solving' ||
    phase === 'finishing'
  );
}
