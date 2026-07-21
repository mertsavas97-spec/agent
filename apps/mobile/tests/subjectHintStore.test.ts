import {
  peekPendingSubjectHint,
  setPendingSubjectHint,
  takePendingSubjectHint,
} from '../src/features/solve/subjectHintStore';

describe('subjectHintStore', () => {
  beforeEach(() => {
    setPendingSubjectHint(null);
  });

  it('stores and consumes hint once', () => {
    setPendingSubjectHint('turkish');
    expect(peekPendingSubjectHint()).toBe('turkish');
    expect(takePendingSubjectHint()).toBe('turkish');
    expect(takePendingSubjectHint()).toBeNull();
  });
});
