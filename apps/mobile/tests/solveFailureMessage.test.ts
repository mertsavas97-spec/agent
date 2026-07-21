import { solveFailureMessage } from '../src/features/solve/solveFailureMessage';

describe('solveFailureMessage', () => {
  it('maps permission-denied to neutral user copy', () => {
    expect(solveFailureMessage({ code: 'functions/permission-denied', message: 'denied' })).toMatch(
      /erişilemiyor/i,
    );
  });

  it('falls back for unknown errors', () => {
    expect(solveFailureMessage(new Error('x'))).toMatch(/üretilemedi/);
  });

  it('detects 403 in plain Error message without exposing infrastructure', () => {
    expect(solveFailureMessage(new Error('403 Forbidden'))).toMatch(/erişilemiyor/i);
  });

  it('maps SOLVE_TIMEOUT to neutral retry copy', () => {
    expect(
      solveFailureMessage(
        Object.assign(new Error('SOLVE_TIMEOUT'), { code: 'functions/deadline-exceeded' }),
      ),
    ).toMatch(/uzun sürdü|tekrar dene/i);
  });
});
