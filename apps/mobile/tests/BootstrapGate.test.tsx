import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/src/lib/auth', () => ({
  subscribeAuth: (cb: (u: { uid: string } | null) => void) => {
    cb({ uid: 'u1' });
    return () => undefined;
  },
  ensureSignedIn: async () => ({ uid: 'u1' }),
}));

jest.mock('@/src/features/onboarding/completeClient', () => ({
  fetchOnboardingStatus: async () => ({ done: true }),
}));

import { BootstrapGate } from '@/src/features/auth/BootstrapGate';

describe('BootstrapGate', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    process.env.EXPO_PUBLIC_SCREENSHOT_MODE = '0';
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
