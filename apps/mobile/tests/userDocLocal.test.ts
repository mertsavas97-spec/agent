jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: () => ({ _sent: true }),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({ db: {} }),
}));

import { buildLocalUserDoc, isExamType } from '@/src/features/auth/userDocLocal';

describe('userDocLocal', () => {
  it('accepts exam types', () => {
    expect(isExamType('lgs')).toBe(true);
    expect(isExamType('ygs')).toBe(true);
    expect(isExamType('kpss')).toBe(true);
    expect(isExamType('tyt')).toBe(false);
  });

  it('builds free-tier defaults for Firestore create rules', () => {
    const doc = buildLocalUserDoc('ygs');
    expect(doc.examType).toBe('ygs');
    expect(doc.subscriptionStatus).toBe('free');
    expect(doc.streakCount).toBe(0);
    expect(doc.onboardingCompletedAt).toBeNull();
    expect(doc.deleteRequestedAt).toBeNull();
  });
});
