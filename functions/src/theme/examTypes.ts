export type ExamType = 'lgs' | 'ygs' | 'kpss';

export const EXAM_TYPES: readonly ExamType[] = ['lgs', 'ygs', 'kpss'] as const;

export function isExamType(value: string): value is ExamType {
  return (EXAM_TYPES as readonly string[]).includes(value);
}
