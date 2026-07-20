import { callUpdateExamType } from '@/src/features/exam/updateExamClient';

jest.mock('@/src/lib/auth', () => ({
  ensureSignedIn: jest.fn().mockResolvedValue({ uid: 'u1' }),
}));

jest.mock('@/src/lib/firebase', () => ({
  getFirebase: () => ({
    functions: {},
  }),
}));

const mockWriteExamPreference = jest.fn().mockResolvedValue(undefined);
jest.mock('@/src/features/exam/examPreference', () => ({
  writeExamPreference: (...args: unknown[]) => mockWriteExamPreference(...args),
}));

const mockUpdateExamTypeLocal = jest.fn().mockResolvedValue('trafik');
jest.mock('@/src/features/auth/userDocLocal', () => ({
  updateExamTypeLocal: (...args: unknown[]) => mockUpdateExamTypeLocal(...args),
}));

const mockCallable = jest.fn();
jest.mock('firebase/functions', () => ({
  httpsCallable: () => mockCallable,
}));

describe('callUpdateExamType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts trafik from callable response', async () => {
    mockCallable.mockResolvedValue({ data: { examType: 'trafik' } });
    await expect(callUpdateExamType('trafik')).resolves.toBe('trafik');
    expect(mockWriteExamPreference).toHaveBeenCalledWith('trafik');
    expect(mockUpdateExamTypeLocal).not.toHaveBeenCalled();
  });

  it('falls back to local when callable rejects trafik', async () => {
    mockCallable.mockRejectedValue(new Error('invalid-argument'));
    mockUpdateExamTypeLocal.mockResolvedValue('trafik');
    await expect(callUpdateExamType('trafik')).resolves.toBe('trafik');
    expect(mockUpdateExamTypeLocal).toHaveBeenCalledWith('u1', 'trafik');
  });

  it('keeps selection via preference when cloud + local both fail', async () => {
    mockCallable.mockRejectedValue(new Error('fail'));
    mockUpdateExamTypeLocal.mockRejectedValue(new Error('permission-denied'));
    await expect(callUpdateExamType('trafik')).resolves.toBe('trafik');
    expect(mockWriteExamPreference).toHaveBeenCalledWith('trafik');
  });
});
