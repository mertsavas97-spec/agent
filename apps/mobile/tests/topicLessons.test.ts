import { lessonForTopic, buildFallbackLesson } from '@/src/data/topicLessons';

describe('topicLessons', () => {
  it('returns rich primer for known topics', () => {
    const lesson = lessonForTopic('lgs-math-kesirler');
    expect(lesson?.headline).toMatch(/Kesir/);
    expect(lesson?.bullets.length).toBeGreaterThanOrEqual(2);
    expect(lesson?.tip.length).toBeGreaterThan(5);
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
    expect(lesson.bullets.join(' ')).toMatch(/ortaokul|LGS/i);
  });

  it('brands trafik / ygs / kpss lessons distinctly', () => {
    expect(
      buildFallbackLesson({
        topicId: 'trafik-traffic-x',
        nameTr: 'Hız',
        subject: 'traffic',
        examType: 'trafik',
      }).headline,
    ).toMatch(/Trafik/);
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
});
