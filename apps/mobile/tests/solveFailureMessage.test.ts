import { FirebaseError } from 'firebase/app';

import { solveFailureMessage } from '../src/features/solve/solveFailureMessage';

describe('solveFailureMessage', () => {
  it('maps permission-denied to IAM copy', () => {
    const err = new FirebaseError('functions/permission-denied', 'denied');
    expect(solveFailureMessage(err)).toMatch(/403|IAM/);
  });

  it('falls back for unknown errors', () => {
    expect(solveFailureMessage(new Error('x'))).toMatch(/üretilemedi/);
  });
});
