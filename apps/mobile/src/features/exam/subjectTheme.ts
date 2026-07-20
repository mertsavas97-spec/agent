import type { Subject } from '@/src/lib/api/types';

import { colors } from '@/src/theme';

/**
 * Per-subject accent for Konular / örnek cards (under exam theme).
 * Distinct from exam solids so hierarchy exam → ders → konu reads clearly.
 */
export type SubjectTheme = {
  solid: string;
  soft: string;
};

const FALLBACK: SubjectTheme = { solid: colors.navy, soft: colors.navySoft };

export const SUBJECT_THEME: Record<Exclude<Subject, 'unknown'>, SubjectTheme> = {
  math: { solid: '#0F766E', soft: '#CCFBF1' },
  geometry: { solid: '#0D9488', soft: '#99F6E4' },
  turkish: { solid: '#B45309', soft: '#FEF3C7' },
  literature: { solid: '#C2410C', soft: '#FFEDD5' },
  science: { solid: '#15803D', soft: '#DCFCE7' },
  physics: { solid: '#1D4ED8', soft: '#DBEAFE' },
  chemistry: { solid: '#7C3AED', soft: '#EDE9FE' },
  biology: { solid: '#059669', soft: '#D1FAE5' },
  history: { solid: '#9A3412', soft: '#FFEDD5' },
  geography: { solid: '#0369A1', soft: '#E0F2FE' },
  philosophy: { solid: '#6D28D9', soft: '#EDE9FE' },
  religion: { solid: '#A16207', soft: '#FEF9C3' },
  english: { solid: '#BE185D', soft: '#FCE7F3' },
  civics: { solid: '#1E3A8A', soft: '#DBEAFE' },
  current: { solid: '#334155', soft: '#E2E8F0' },
  traffic: { solid: '#B91C1C', soft: '#FEE2E2' },
  vehicle: { solid: '#C2410C', soft: '#FFEDD5' },
  firstaid: { solid: '#DC2626', soft: '#FEE2E2' },
};

export function subjectThemeFor(subject: Subject | null | undefined): SubjectTheme {
  if (!subject || subject === 'unknown') return FALLBACK;
  return SUBJECT_THEME[subject] ?? FALLBACK;
}
