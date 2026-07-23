import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
let mockPathname = '/';

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(() => Promise.resolve()),
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/src/lib/auth', () => ({
  subscribeAuth: (cb: (u: { uid: string } | null) => void) => {
    cb({ uid: 'u1' });
    return () => undefined;
  },
  ensureSignedIn: async () => ({ uid: 'u1' }),
}));

jest.mock('@/src/features/paywall/entitlement', () => ({
  hydrateEntitlement: jest.fn(async () => null),
}));

jest.mock('@/src/lib/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
  getFirebase: jest.fn(),
}));

jest.mock('@/src/features/push/localPush', () => ({
  bootLocalPush: jest.fn(async () => ({
    ok: true,
    scheduled: [],
    permissionGranted: false,
  })),
}));

jest.mock('@/src/features/push/pushPrefs', () => ({
  loadPushPrefs: jest.fn(async () => ({ master: false })),
}));

const mockFetchOnboardingStatus = jest.fn();

jest.mock('@/src/features/onboarding/completeClient', () => ({
  fetchOnboardingStatus: (...args: unknown[]) => mockFetchOnboardingStatus(...args),
}));

import * as SplashScreen from 'expo-splash-screen';

import { BootstrapGate } from '@/src/features/auth/BootstrapGate';

describe('BootstrapGate', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockFetchOnboardingStatus.mockClear();
    mockPathname = '/';
    process.env.EXPO_PUBLIC_SCREENSHOT_MODE = '0';
    mockFetchOnboardingStatus.mockResolvedValue({ done: true, examType: 'lgs' });
    jest.mocked(SplashScreen.hideAsync).mockClear();
  });

  it('keeps children mounted after boot (no Redirect unmount loop)', async () => {
    const { getByTestId, queryByTestId } = render(
      <BootstrapGate>
        <Text testID="child">ok</Text>
      </BootstrapGate>,
    );

    await waitFor(() => {
      expect(queryByTestId('bootstrap-loading')).toBeNull();
      expect(getByTestId('child')).toBeTruthy();
    });
  });

  it('covers the stack and routes to onboarding without a home flash', async () => {
    mockFetchOnboardingStatus.mockResolvedValue({ done: false, examType: null });

    const { getByTestId, queryByTestId, rerender } = render(
      <BootstrapGate>
        <Text testID="child">tabs</Text>
      </BootstrapGate>,
    );

    expect(getByTestId('bootstrap-loading')).toBeTruthy();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });

    // Still covered until pathname reflects onboarding
    expect(getByTestId('bootstrap-loading')).toBeTruthy();
    expect(getByTestId('child')).toBeTruthy();

    mockPathname = '/onboarding';
    rerender(
      <BootstrapGate>
        <Text testID="child">tabs</Text>
      </BootstrapGate>,
    );

    await waitFor(() => {
      expect(queryByTestId('bootstrap-loading')).toBeNull();
    });
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('does not re-fetch onboarding before navigating to /onboarding', async () => {
    mockFetchOnboardingStatus.mockResolvedValue({ done: false, examType: null });

    render(
      <BootstrapGate>
        <Text testID="child">tabs</Text>
      </BootstrapGate>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });

    // Boot may run twice under Strict Mode; must not add a confirm fetch before replace.
    expect(mockFetchOnboardingStatus.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
