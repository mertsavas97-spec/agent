import { solveFailureMessage } from '../src/features/solve/solveFailureMessage';

describe('solveFailureMessage', () => {
  it('maps permission-denied to IAM copy', () => {
    expect(solveFailureMessage({ code: 'functions/permission-denied', message: 'denied' })).toMatch(
      /403|IAM/,
    );
  });

  it('falls back for unknown errors', () => {
    expect(solveFailureMessage(new Error('x'))).toMatch(/üretilemedi/);
  });

  it('detects 403 in plain Error message', () => {
    expect(solveFailureMessage(new Error('403 Forbidden'))).toMatch(/403/);
  });
});
