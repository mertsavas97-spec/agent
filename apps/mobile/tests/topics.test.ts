import { KPSS_TOPICS, LGS_TOPICS, YGS_TOPICS, findTopic, topicsForExam } from '@/src/data';

describe('mobile topic catalogs', () => {
  it('covers LGS YGS KPSS', () => {
    expect(topicsForExam('lgs')).toBe(LGS_TOPICS);
    expect(topicsForExam('ygs')).toBe(YGS_TOPICS);
    expect(topicsForExam('kpss')).toBe(KPSS_TOPICS);
  });

  it('finds topic by id', () => {
    const sample = LGS_TOPICS[0];
    expect(findTopic(sample.id)?.nameTr).toBe(sample.nameTr);
  });
});
