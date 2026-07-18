import type { ProgressTopic } from '../types/contracts';

/**
 * Weakest = highest followUpCount; tie-break lower attemptCount, then topicId.
 */
export function selectWeakestTopic(topics: ProgressTopic[]): ProgressTopic | null {
  if (topics.length === 0) return null;
  return [...topics].sort((a, b) => {
    if (b.followUpCount !== a.followUpCount) return b.followUpCount - a.followUpCount;
    if (a.attemptCount !== b.attemptCount) return a.attemptCount - b.attemptCount;
    return a.topicId.localeCompare(b.topicId);
  })[0]!;
}
