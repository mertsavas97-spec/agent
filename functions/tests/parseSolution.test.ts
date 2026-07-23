import {
  isGeometryUnsupported,
  parseModelSolution,
  repairJsonText,
} from '../src/solve/parseSolution';

describe('parseModelSolution', () => {
  it('parses JSON steps', () => {
    const parsed = parseModelSolution(
      JSON.stringify({
        isQuestion: true,
        unsupported: false,
        subject: 'math',
        topicId: 'lgs-math-kesirler',
        steps: [{ title: '1', body: 'x' }],
      }),
    );
    expect(parsed.steps).toHaveLength(1);
  });

  it('parses structured answer field', () => {
    const parsed = parseModelSolution(
      JSON.stringify({
        isQuestion: true,
        unsupported: false,
        subject: 'math',
        topicId: 'lgs-math-kesirler',
        steps: [
          { title: '1', body: 'işlem' },
          { title: 'Cevap', body: 'Doğru şık: C) 12' },
        ],
        answer: { label: 'C', text: '12' },
      }),
    );
    expect(parsed.answer).toEqual({ label: 'C', text: '12' });
  });

  it('extracts answer from Cevap step when answer field missing', () => {
    const parsed = parseModelSolution(
      JSON.stringify({
        isQuestion: true,
        unsupported: false,
        subject: 'turkish',
        topicId: null,
        steps: [
          { title: '1', body: 'anlatım' },
          { title: 'Cevap', body: 'Doğru şık: E) öyküleme' },
        ],
      }),
    );
    expect(parsed.answer).toEqual({ label: 'E', text: 'öyküleme' });
  });

  it('repairs fenced JSON with trailing comma', () => {
    const raw = 'Here:\n```json\n{"isQuestion":true,"unsupported":false,"subject":"science","topicId":null,"steps":[{"body":"ok"}],}\n```\n';
    const parsed = parseModelSolution(raw);
    expect(parsed.subject).toBe('science');
    expect(parsed.steps[0]?.body).toBe('ok');
    expect(repairJsonText(raw)).toContain('"isQuestion"');
  });

  it('flags geometry unsupported', () => {
    const parsed = parseModelSolution(
      JSON.stringify({
        isQuestion: true,
        unsupported: true,
        unsupportedReason: 'diyagram gerekli',
        subject: 'math',
        steps: [],
      }),
    );
    expect(isGeometryUnsupported(parsed)).toBe(true);
  });
});
