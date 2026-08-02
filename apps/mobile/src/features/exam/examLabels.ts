import type { ExamType } from '@/src/lib/api/types';

export const EXAM_OPTIONS: {
  id: ExamType;
  label: string;
  short: string;
}[] = [
  { id: 'lgs', label: 'LGS', short: 'Lise' },
  // Internal id stays `ygs` (topics / Firestore); user-facing label is YKS.
  { id: 'ygs', label: 'YKS', short: 'Üniversite' },
  { id: 'kpss', label: 'KPSS', short: 'Kamu' },
  { id: 'trafik', label: 'Ehliyet', short: 'Sürücü' },
];

export const EXAM_LABEL: Record<ExamType, string> = {
  lgs: 'LGS',
  ygs: 'YKS',
  kpss: 'KPSS',
  trafik: 'Ehliyet',
};

export const EXAM_SHORT: Record<ExamType, string> = {
  lgs: 'Lise giriş',
  ygs: 'Üniversite',
  kpss: 'Kamu personeli',
  trafik: 'Ehliyet / MTS',
};
