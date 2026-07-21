import { SolvePipelineError } from '../src/solve/executeSolve';

describe('SolvePipelineError', () => {
  it('carries http-ish code', () => {
    const err = new SolvePipelineError('x', 'resource-exhausted');
    expect(err.code).toBe('resource-exhausted');
    expect(err.name).toBe('SolvePipelineError');
  });
});
