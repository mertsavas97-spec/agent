import type { ExamType } from '@/src/lib/api/types';

export const EXAM_OPTIONS: { id: ExamType; label: string }[] = [
  { id: 'lgs', label: 'LGS' },
  { id: 'ygs', label: 'YGS' },
  { id: 'kpss', label: 'KPSS' },
];

export const EXAM_LABEL: Record<ExamType, string> = {
  lgs: 'LGS',
  ygs: 'YGS',
  kpss: 'KPSS',
};
