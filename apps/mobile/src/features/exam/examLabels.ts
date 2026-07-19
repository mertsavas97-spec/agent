import type { ExamType } from '@/src/lib/api/types';

export const EXAM_OPTIONS: {
  id: ExamType;
  label: string;
  short: string;
}[] = [
  { id: 'lgs', label: 'LGS', short: 'Lise giriş' },
  { id: 'ygs', label: 'YGS', short: 'Üniversite' },
  { id: 'kpss', label: 'KPSS', short: 'Kamu' },
  { id: 'trafik', label: 'Trafik', short: 'Ehliyet' },
];

export const EXAM_LABEL: Record<ExamType, string> = {
  lgs: 'LGS',
  ygs: 'YGS',
  kpss: 'KPSS',
  trafik: 'Trafik',
};

export const EXAM_SHORT: Record<ExamType, string> = {
  lgs: 'Lise giriş',
  ygs: 'Üniversite',
  kpss: 'Kamu personeli',
  trafik: 'Ehliyet / MTS',
};
