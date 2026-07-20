import type { ExamType } from '@/src/lib/api/types';

export const EXAM_TYPES: readonly ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'] as const;

export function isExamType(value: unknown): value is ExamType {
  return typeof value === 'string' && (EXAM_TYPES as readonly string[]).includes(value);
}
