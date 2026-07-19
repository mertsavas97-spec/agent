import { lessonForTopic, buildFallbackLesson } from '@/src/data/topicLessons';

describe('topicLessons', () => {
  it('returns rich primer for known topics', () => {
    const lesson = lessonForTopic('lgs-math-kesirler');
    expect(lesson?.headline).toMatch(/Kesir/);
    expect(lesson?.bullets.length).toBeGreaterThanOrEqual(2);
    expect(lesson?.tip.length).toBeGreaterThan(5);
  });

  it('builds fallback for unknown topic ids', () => {
    const lesson = buildFallbackLesson({
      topicId: 'lgs-math-xyz',
      nameTr: 'Deneme',
      subject: 'math',
      examType: 'lgs',
    });
    expect(lesson.headline).toMatch(/Deneme/);
    expect(lesson.bullets[0]).toMatch(/ortaokul/);
  });
});
