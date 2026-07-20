import type { AttemptListItem, ExamType, Subject } from '@/src/lib/api/types';

export type AttemptFilters = {
  examType?: ExamType | 'all';
  subject?: Subject | 'all';
  topicId?: string | 'all';
};

export function filterAttempts(
  items: AttemptListItem[],
  filters: AttemptFilters,
): AttemptListItem[] {
  return items.filter((item) => {
    if (
      filters.examType &&
      filters.examType !== 'all' &&
      item.examType &&
      item.examType !== filters.examType
    ) {
      return false;
    }
    if (filters.subject && filters.subject !== 'all' && item.subject !== filters.subject) {
      return false;
    }
    if (filters.topicId && filters.topicId !== 'all' && item.topicId !== filters.topicId) {
      return false;
    }
    return true;
  });
}
