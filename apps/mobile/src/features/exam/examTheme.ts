import type { ExamType } from '@/src/lib/api/types';

import { EXAM_LABEL, EXAM_SHORT } from './examLabels';

/**
 * Per-exam accent palette — makes “which exam am I in?” obvious on Home.
 * Keeps brand navy for chrome; each exam owns a solid + soft pair.
 */
export type ExamTheme = {
  id: ExamType;
  label: string;
  short: string;
  /** Selected control fill */
  solid: string;
  /** Soft surface / card wash */
  soft: string;
  /** Border / underline accent */
  accent: string;
  /** Prominent mode chip, e.g. MOD: YGS */
  modeChip: string;
};

export const EXAM_THEME: Record<ExamType, ExamTheme> = {
  lgs: {
    id: 'lgs',
    label: EXAM_LABEL.lgs,
    short: EXAM_SHORT.lgs,
    solid: '#0F766E',
    soft: '#CCFBF1',
    accent: '#14B8A6',
    modeChip: 'MOD: LGS',
  },
  ygs: {
    id: 'ygs',
    label: EXAM_LABEL.ygs,
    short: EXAM_SHORT.ygs,
    solid: '#B45309',
    soft: '#FEF3C7',
    accent: '#F59E0B',
    modeChip: 'MOD: YGS',
  },
  kpss: {
    id: 'kpss',
    label: EXAM_LABEL.kpss,
    short: EXAM_SHORT.kpss,
    solid: '#1E3A8A',
    soft: '#DBEAFE',
    accent: '#3B82F6',
    modeChip: 'MOD: KPSS',
  },
};

export function examThemeFor(exam: ExamType | null | undefined): ExamTheme | null {
  if (!exam) return null;
  return EXAM_THEME[exam] ?? null;
}
