import type { ExamType, Subject } from '@/src/lib/api/types';

export type Topic = {
  id: string;
  examType: ExamType;
  subject: Subject;
  nameTr: string;
};

export function topicId(exam: ExamType, subject: Subject, slug: string): string {
  return `${exam}-${subject}-${slug}`;
}
