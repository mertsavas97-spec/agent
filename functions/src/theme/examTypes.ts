export type ExamType = 'lgs' | 'ygs' | 'kpss' | 'trafik';

export const EXAM_TYPES: readonly ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'] as const;

export function isExamType(value: string): value is ExamType {
  return (EXAM_TYPES as readonly string[]).includes(value);
}
