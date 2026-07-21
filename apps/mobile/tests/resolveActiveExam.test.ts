import { resolveActiveExamType } from '@/src/features/exam/resolveActiveExam';
import { invalidateExamPreferenceCache } from '@/src/features/exam/examPreferenceCache';

const mockReadExamPreference = jest.fn();
jest.mock('@/src/features/exam/examPreference', () => ({
  readExamPreference: () => mockReadExamPreference(),
}));

jest.mock('@/src/lib/auth', () => ({
  ensureSignedIn: jest.fn().mockResolvedValue({ uid: 'u1' }),
}));

const mockGetDoc = jest.fn();
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({ db: {} }),
}));

describe('resolveActiveExamType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateExamPreferenceCache();
  });

  it('prefers explicit param', async () => {
    mockReadExamPreference.mockResolvedValue('kpss');
    await expect(resolveActiveExamType('trafik')).resolves.toEqual({
      examType: 'trafik',
      source: 'param',
    });
  });

  it('prefers AsyncStorage over Firestore KPSS', async () => {
    mockReadExamPreference.mockResolvedValue('trafik');
    mockGetDoc.mockResolvedValue({ data: () => ({ examType: 'kpss' }) });
    await expect(resolveActiveExamType(null)).resolves.toEqual({
      examType: 'trafik',
      source: 'preference',
    });
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('falls back to Firestore when no preference', async () => {
    mockReadExamPreference.mockResolvedValue(null);
    mockGetDoc.mockResolvedValue({ data: () => ({ examType: 'ygs' }) });
    await expect(resolveActiveExamType(undefined)).resolves.toEqual({
      examType: 'ygs',
      source: 'firestore',
    });
  });
});
