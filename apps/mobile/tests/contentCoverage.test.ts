import { topicsForExam } from '@/src/data';
import { itemsForTopic, MIN_SAMPLES_PER_TOPIC } from '@/src/data/itemBank';
import { lessonForTopic } from '@/src/data/topicLessons';
import type { ExamType } from '@/src/lib/api/types';

const EXAMS: ExamType[] = ['lgs', 'ygs', 'kpss', 'trafik'];

const EXAM_VOICE: Record<ExamType, RegExp> = {
  lgs: /\bLGS\b/i,
  ygs: /\bYGS\b|\bYKS\b|\bTYT\b|\bAYT\b/i,
  kpss: /\bKPSS\b/i,
  trafik: /\bTrafik\b|\behliyet\b|\bMTS\b/i,
};

describe('catalog content coverage', () => {
  it(`every topic has ≥${MIN_SAMPLES_PER_TOPIC} sample questions with answers`, () => {
    const weak: string[] = [];
    for (const exam of EXAMS) {
      for (const topic of topicsForExam(exam)) {
        const items = itemsForTopic(topic.id);
        if (items.length < MIN_SAMPLES_PER_TOPIC) {
          weak.push(`${topic.id}:${items.length}`);
          continue;
        }
        for (const item of items) {
          expect(item.answerKey).toMatch(/^[A-E]$/);
          expect(item.choices[item.answerKey]).toBeTruthy();
          expect(item.explanationSteps.length).toBeGreaterThanOrEqual(1);
          expect(item.stem.length).toBeGreaterThan(10);
        }
      }
    }
    expect(weak).toEqual([]);
  });

  it('every topic lesson carries exam + branch wording', () => {
    const weak: string[] = [];
    for (const exam of EXAMS) {
      for (const topic of topicsForExam(exam)) {
        const lesson = lessonForTopic(topic.id, {
          nameTr: topic.nameTr,
          subject: topic.subject,
          examType: topic.examType,
        });
        expect(lesson).toBeTruthy();
        expect(lesson!.bullets.length).toBeGreaterThanOrEqual(2);
        expect(lesson!.summary.length).toBeGreaterThan(8);
        expect(lesson!.examCue.length).toBeGreaterThan(8);
        expect(lesson!.checkPrompt.length).toBeGreaterThan(5);
        const blob = `${lesson!.headline}\n${lesson!.summary}\n${lesson!.bullets.join('\n')}\n${lesson!.examCue}\n${lesson!.tip}`;
        if (!EXAM_VOICE[exam].test(blob)) {
          weak.push(`${topic.id}: missing exam voice`);
        }
        if (!blob.includes(topic.nameTr) && !lesson!.headline.includes(topic.nameTr)) {
          // headline always includes nameTr in catalog builder
          weak.push(`${topic.id}: missing topic name`);
        }
        // Branch / subject signal
        const subjectHint =
          topic.subject === 'traffic'
            ? /Trafik/i
            : topic.subject === 'vehicle'
              ? /Araç|ABS|fren|motor|elektrik/i
              : topic.subject === 'firstaid'
                ? /İlk Yardım|ABC|kanama|yanık|kırık/i
                : new RegExp(topic.nameTr.slice(0, 4), 'i');
        if (!subjectHint.test(blob)) {
          weak.push(`${topic.id}: weak branch wording`);
        }
      }
    }
    expect(weak).toEqual([]);
  });
});
