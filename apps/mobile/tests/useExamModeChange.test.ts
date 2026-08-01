import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useExamModeChange } from '@/src/features/exam/useExamModeChange';
import { callUpdateExamType } from '@/src/features/exam/updateExamClient';
import { setExamPreferenceCache } from '@/src/features/exam/examPreferenceCache';
import { runRewardedExamSwitch } from '@/src/features/ads/runRewardedExamSwitch';
import { isPremiumAudience } from '@/src/features/ads/premiumGate';

jest.mock('@/src/features/exam/updateExamClient', () => ({
  callUpdateExamType: jest.fn().mockResolvedValue('ygs'),
}));

jest.mock('@/src/features/exam/examPreferenceCache', () => ({
  setExamPreferenceCache: jest.fn(),
}));

jest.mock('@/src/features/ads/runRewardedExamSwitch', () => ({
  runRewardedExamSwitch: jest.fn(async () => ({
    allowed: true,
    reason: 'rewarded' as const,
  })),
}));

jest.mock('@/src/features/ads/premiumGate', () => ({
  isPremiumAudience: jest.fn(() => false),
}));

jest.mock('@/src/ui/haptics', () => ({
  hapticSelection: jest.fn(),
}));

function pressConfirmOnAlert() {
  const call = (Alert.alert as jest.Mock).mock.calls.at(-1);
  const buttons = call?.[2] as Array<{ text?: string; onPress?: () => void }> | undefined;
  const confirm = buttons?.find((b) => b.text && b.text !== 'Vazgeç');
  confirm?.onPress?.();
}

describe('useExamModeChange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (isPremiumAudience as jest.Mock).mockReturnValue(false);
    (runRewardedExamSwitch as jest.Mock).mockResolvedValue({
      allowed: true,
      reason: 'rewarded',
    });
  });

  it('asks confirm then runs rewarded when switching between exam packages', async () => {
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

    expect(runRewardedExamSwitch).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Mod: YKS',
      expect.stringMatching(/ödüllü reklam/i),
      expect.any(Array),
    );

    await act(async () => {
      pressConfirmOnAlert();
    });

    expect(runRewardedExamSwitch).toHaveBeenCalled();
    expect(setExamPreferenceCache).toHaveBeenCalledWith('ygs');
    expect(onOptimistic).toHaveBeenCalledWith('ygs');
    expect(callUpdateExamType).toHaveBeenCalledWith('ygs');
  });

  it('blocks the switch when the rewarded ad is dismissed after confirm', async () => {
    (runRewardedExamSwitch as jest.Mock).mockResolvedValue({
      allowed: false,
      reason: 'dismissed',
    });
    const onOptimistic = jest.fn();
    const { result } = renderHook(() => useExamModeChange({ onOptimistic }));

    await act(async () => {
      result.current.requestExamChange('lgs', 'kpss');
    });
    await act(async () => {
      pressConfirmOnAlert();
    });

    expect(onOptimistic).not.toHaveBeenCalled();
    expect(callUpdateExamType).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Mod değişmedi',
      expect.any(String),
    );
  });

  it('allows first pick when current exam is still null without confirm or ad', async () => {
    const onOptimistic = jest.fn();
    const { result } = renderHook(() =>
      useExamModeChange({ onOptimistic }),
    );

    await act(async () => {
      result.current.requestExamChange(null, 'kpss');
    });

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(runRewardedExamSwitch).not.toHaveBeenCalled();
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
    await act(async () => {
      pressConfirmOnAlert();
    });
    expect(callUpdateExamType).toHaveBeenCalledTimes(1);

    // Same target while in flight — ignored (no stuck disable, but no spam).
    await act(async () => {
      result.current.requestExamChange('lgs', 'ygs');
    });
    // Confirm dialog opens again but we do not press it.
    expect(callUpdateExamType).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveUpdate?.('ygs');
    });

    // After settle, focus race can leave UI on lgs while last pick was ygs —
    // re-tap must work again.
    await act(async () => {
      result.current.requestExamChange('lgs', 'ygs');
    });
    await act(async () => {
      pressConfirmOnAlert();
    });
    expect(callUpdateExamType).toHaveBeenCalledTimes(2);
  });

  it('never reports switching=true so segmented tabs stay enabled', () => {
    const { result } = renderHook(() => useExamModeChange());
    expect(result.current.switching).toBe(false);
  });
});
