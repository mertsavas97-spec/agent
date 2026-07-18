import { isGeometryUnsupported, parseModelSolution } from '../src/solve/parseSolution';

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
