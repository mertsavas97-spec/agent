import { topicsForExam } from '@/src/data';
import { bankCoverageStats } from '@/src/data/topicLessonBank';
import {
  buildFallbackLesson,
  fullLessonCtaLabel,
  lessonForTopic,
  solutionLessonBullets,
} from '@/src/data/topicLessons';

describe('topicLessons', () => {
  it('returns rich primer for known topics', () => {
    const lesson = lessonForTopic('lgs-math-kesirler');
    expect(lesson?.headline).toMatch(/Kesir/);
    expect(lesson?.summary.length).toBeGreaterThan(10);
    expect(lesson?.bullets.length).toBeGreaterThanOrEqual(3);
    expect(lesson?.examCue).toMatch(/LGS/i);
    expect(lesson?.checkPrompt.length).toBeGreaterThan(5);
    expect(lesson?.tip.length).toBeGreaterThan(5);
  });

  it('covers every catalog topic in the lesson bank', () => {
    const all = [
      ...topicsForExam('lgs'),
      ...topicsForExam('ygs'),
      ...topicsForExam('kpss'),
      ...topicsForExam('trafik'),
    ];
    const stats = bankCoverageStats(all);
    expect(stats.missing).toEqual([]);
    expect(stats.banked).toBe(stats.total);
  });

  it('builds fallback for unknown topic ids with LGS voice', () => {
    const lesson = buildFallbackLesson({
      topicId: 'lgs-math-xyz',
      nameTr: 'Deneme',
      subject: 'math',
      examType: 'lgs',
    });
    expect(lesson.headline).toMatch(/LGS/);
    expect(lesson.headline).toMatch(/Deneme/);
    expect(lesson.summary).toMatch(/LGS/i);
    expect(lesson.bullets.join(' ')).toMatch(/LGS/i);
  });

  it('brands trafik / ygs / kpss lessons distinctly', () => {
    expect(
      buildFallbackLesson({
        topicId: 'trafik-traffic-x',
        nameTr: 'Hız',
        subject: 'traffic',
        examType: 'trafik',
      }).headline,
    ).toMatch(/Ehliyet/);
    expect(
      buildFallbackLesson({
        topicId: 'ygs-math-x',
        nameTr: 'Limit',
        subject: 'math',
        examType: 'ygs',
      }).headline,
    ).toMatch(/YGS/);
    expect(
      buildFallbackLesson({
        topicId: 'kpss-math-x',
        nameTr: 'Yüzde',
        subject: 'math',
        examType: 'kpss',
      }).headline,
    ).toMatch(/KPSS/);
  });

  it('builds exam-aware full-lesson CTA and trims solution bullets', () => {
    expect(
      fullLessonCtaLabel({ examType: 'kpss', topicName: 'Paragraf' }),
    ).toMatch(/KPSS · Paragraf/);
    const lesson = lessonForTopic('ygs-math-fonksiyonlar');
    expect(lesson).toBeTruthy();
    expect(solutionLessonBullets(lesson!).length).toBeLessThanOrEqual(3);
  });
});
