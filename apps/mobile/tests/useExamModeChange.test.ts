import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useExamModeChange } from '@/src/features/exam/useExamModeChange';
import { callUpdateExamType } from '@/src/features/exam/updateExamClient';
import { setExamPreferenceCache } from '@/src/features/exam/examPreferenceCache';

jest.mock('@/src/features/exam/updateExamClient', () => ({
  callUpdateExamType: jest.fn().mockResolvedValue('ygs'),
}));

jest.mock('@/src/features/exam/examPreferenceCache', () => ({
  setExamPreferenceCache: jest.fn(),
}));

jest.mock('@/src/ui/haptics', () => ({
  hapticSelection: jest.fn(),
}));

describe('useExamModeChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('switches immediately without a rewarded-ad alert', async () => {
    const onOptimistic = jest.fn();
    const { result } = renderHook(() =>
      useExamModeChange({
        ent: null,
        onOptimistic,
      }),
    );

    await act(async () => {
      result.current.requestExamChange('lgs', 'ygs');
    });

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(setExamPreferenceCache).toHaveBeenCalledWith('ygs');
    expect(onOptimistic).toHaveBeenCalledWith('ygs');
    expect(callUpdateExamType).toHaveBeenCalledWith('ygs');
  });

  it('allows first pick when current exam is still null', async () => {
    const onOptimistic = jest.fn();
    const { result } = renderHook(() =>
      useExamModeChange({ onOptimistic }),
    );

    await act(async () => {
      result.current.requestExamChange(null, 'kpss');
    });

    expect(onOptimistic).toHaveBeenCalledWith('kpss');
    expect(callUpdateExamType).toHaveBeenCalledWith('kpss');
  });

  it('allows re-tap after sync settles even for a previously requested package', async () => {
    let resolveUpdate: ((v: string) => void) | undefined;
    (callUpdateExamType as jest.Mock).mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    const onOptimistic = jest.fn();
    const { result } = renderHook(() => useExamModeChange({ onOptimistic }));

    await act(async () => {
      result.current.requestExamChange('lgs', 'ygs');
    });
    expect(callUpdateExamType).toHaveBeenCalledTimes(1);

    // Same target while in flight — ignored (no stuck disable, but no spam).
    await act(async () => {
      result.current.requestExamChange('lgs', 'ygs');
    });
    expect(callUpdateExamType).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpdate?.('ygs');
    });

    // After settle, focus race can leave UI on lgs while last pick was ygs —
    // re-tap must work again.
    await act(async () => {
      result.current.requestExamChange('lgs', 'ygs');
    });
    expect(callUpdateExamType).toHaveBeenCalledTimes(2);
  });

  it('never reports switching=true so segmented tabs stay enabled', () => {
    const { result } = renderHook(() => useExamModeChange());
    expect(result.current.switching).toBe(false);
  });
});
