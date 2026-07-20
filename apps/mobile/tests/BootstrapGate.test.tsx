import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
let mockPathname = '/';

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/src/lib/auth', () => ({
  subscribeAuth: (cb: (u: { uid: string } | null) => void) => {
    cb({ uid: 'u1' });
    return () => undefined;
  },
  ensureSignedIn: async () => ({ uid: 'u1' }),
}));

const mockFetchOnboardingStatus = jest.fn();
const mockSubmitOnboarding = jest.fn();

jest.mock('@/src/features/onboarding/completeClient', () => ({
  fetchOnboardingStatus: (...args: unknown[]) => mockFetchOnboardingStatus(...args),
  submitOnboarding: (...args: unknown[]) => mockSubmitOnboarding(...args),
}));

import { BootstrapGate } from '@/src/features/auth/BootstrapGate';

describe('BootstrapGate', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPathname = '/';
    process.env.EXPO_PUBLIC_SCREENSHOT_MODE = '0';
    mockFetchOnboardingStatus.mockResolvedValue({ done: true, examType: 'lgs' });
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
});
