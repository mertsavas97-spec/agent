import type { ExamType } from '@/src/lib/api/types';

import { KPSS_TOPICS } from './kpss-topics';
import { LGS_TOPICS } from './lgs-topics';
import type { Topic } from './topics';
import { YGS_TOPICS } from './ygs-topics';

export type { Topic } from './topics';
export { KPSS_TOPICS, LGS_TOPICS, YGS_TOPICS };

export function topicsForExam(exam: ExamType): Topic[] {
  switch (exam) {
    case 'lgs':
      return LGS_TOPICS;
    case 'ygs':
      return YGS_TOPICS;
    case 'kpss':
      return KPSS_TOPICS;
    default: {
      const _exhaustive: never = exam;
      return _exhaustive;
    }
  }
}

export function findTopic(topicId: string): Topic | undefined {
  return [...LGS_TOPICS, ...YGS_TOPICS, ...KPSS_TOPICS].find((t) => t.id === topicId);
}
