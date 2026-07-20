import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getLocalHistoryEntry,
  listLocalHistory,
  recordLocalAttempt,
  toAttemptListItem,
} from '@/src/features/history/localHistoryStore';

describe('localHistoryStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('records and lists attempts newest first', async () => {
    await recordLocalAttempt({
      attemptId: 'a1',
      solutionId: 's1',
      examType: 'kpss',
      subject: 'turkish',
      topicId: 'kpss-turkish-anlam',
      steps: [{ title: 'Cevap', body: 'Anlam ilgisi: Amaç-sonuç' }],
      answer: { text: 'Amaç-sonuç' },
    });
    await recordLocalAttempt({
      attemptId: 'a2',
      solutionId: 's2',
      examType: 'ygs',
      subject: 'math',
      topicId: 'ygs-math-temel-kavramlar',
      steps: [{ title: 'Cevap', body: 'Sonuç 7' }],
      answer: { text: '7' },
    });

    const list = await listLocalHistory();
    expect(list.map((i) => i.attemptId)).toEqual(['a2', 'a1']);
    expect(toAttemptListItem(list[0]!).examType).toBe('ygs');

    const one = await getLocalHistoryEntry('a1');
    expect(one?.answer?.text).toBe('Amaç-sonuç');
  });

  it('dedupes by attemptId', async () => {
    await recordLocalAttempt({
      attemptId: 'same',
      solutionId: 's1',
      examType: 'lgs',
      subject: 'math',
      topicId: null,
      steps: [{ body: 'v1' }],
    });
    await recordLocalAttempt({
      attemptId: 'same',
      solutionId: 's1',
      examType: 'lgs',
      subject: 'math',
      topicId: null,
      steps: [{ body: 'v2' }],
    });
    const list = await listLocalHistory();
    expect(list).toHaveLength(1);
    expect(list[0]?.steps[0]?.body).toBe('v2');
  });
});
