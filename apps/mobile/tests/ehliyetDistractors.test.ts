import { topicsForExam } from '@/src/data';
import { itemsForTopic } from '@/src/data/itemBank';

/** Cartoon / nonsense distractors that made Ehliyet samples look unserious. */
const BANNED_DISTRACTOR = [
  /toprak doldur/i,
  /koştur/i,
  /^diş macunu sürmek$/i,
  /^un serpmek$/i,
  /^sıcak su dökmek$/i,
  /radyoyu kapat/i,
  /camı indir/i,
  /klima gazı/i,
  /aspiration\s*\//i,
  /susuzluğu giderir her zaman/i,
  /hızlandırır iyileşmeyi/i,
  /^sadece radyo$/i,
  /^hiçbir şey$/i,
];

describe('ehliyet sample distractor quality', () => {
  it('trafik choices avoid cartoon distractors', () => {
    const hits: string[] = [];
    for (const topic of topicsForExam('trafik')) {
      for (const item of itemsForTopic(topic.id)) {
        for (const [key, text] of Object.entries(item.choices)) {
          if (key === item.answerKey) continue;
          for (const re of BANNED_DISTRACTOR) {
            if (re.test(text)) {
              hits.push(`${item.id} ${key}: ${text}`);
            }
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('firstaid wrong choices are full exam-style phrases, not joke stubs', () => {
    const hits: string[] = [];
    for (const topic of topicsForExam('trafik')) {
      if (topic.subject !== 'firstaid') continue;
      for (const item of itemsForTopic(topic.id)) {
        for (const [key, text] of Object.entries(item.choices)) {
          if (key === item.answerKey) continue;
          if (text.trim().split(/\s+/).length < 4) {
            hits.push(`${item.id} ${key}: too short (${text})`);
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('wrong choices stay in similar length band to the correct answer', () => {
    const outliers: string[] = [];
    for (const topic of topicsForExam('trafik')) {
      if (topic.subject !== 'firstaid') continue;
      for (const item of itemsForTopic(topic.id)) {
        const correctLen = item.choices[item.answerKey].length;
        for (const [key, text] of Object.entries(item.choices)) {
          if (key === item.answerKey) continue;
          // Allow some variance but block tiny joke options vs long correct ones
          if (correctLen >= 24 && text.length < correctLen * 0.35) {
            outliers.push(`${item.id} ${key}: ${text.length} vs correct ${correctLen}`);
          }
        }
      }
    }
    expect(outliers).toEqual([]);
  });
});
