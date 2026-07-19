import { topicsForExam } from '@/src/data';
import { itemsForTopic } from '@/src/data/itemBank';
import { lessonForTopic } from '@/src/data/topicLessons';
import type { ExamType } from '@/src/lib/api/types';

const EXAMS: ExamType[] = ['lgs', 'ygs', 'kpss'];

describe('catalog content coverage', () => {
  it('every topic has a lesson (curated or subject-aware fallback)', () => {
    for (const exam of EXAMS) {
      for (const topic of topicsForExam(exam)) {
        const lesson = lessonForTopic(topic.id, {
          nameTr: topic.nameTr,
          subject: topic.subject,
          examType: topic.examType,
        });
        expect(lesson).toBeTruthy();
        expect(lesson!.bullets.length).toBeGreaterThanOrEqual(2);
        expect(lesson!.headline.length).toBeGreaterThan(3);
      }
    }
  });

  it('every topic has at least one sample question', () => {
    const missing: string[] = [];
    for (const exam of EXAMS) {
      for (const topic of topicsForExam(exam)) {
        if (itemsForTopic(topic.id).length === 0) missing.push(topic.id);
      }
    }
    expect(missing).toEqual([]);
  });
});
