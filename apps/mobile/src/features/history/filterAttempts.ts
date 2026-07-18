import type { AttemptListItem, Subject } from '@/src/lib/api/types';

export type AttemptFilters = {
  subject?: Subject | 'all';
  topicId?: string | 'all';
};

export function filterAttempts(
  items: AttemptListItem[],
  filters: AttemptFilters,
): AttemptListItem[] {
  return items.filter((item) => {
    if (filters.subject && filters.subject !== 'all' && item.subject !== filters.subject) {
      return false;
    }
    if (filters.topicId && filters.topicId !== 'all' && item.topicId !== filters.topicId) {
      return false;
    }
    return true;
  });
}
