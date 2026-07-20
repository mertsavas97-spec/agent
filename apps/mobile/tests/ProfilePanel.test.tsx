import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfilePanel } from '@/src/features/profile/ProfilePanel';

const base = {
  examType: 'ygs' as const,
  quotaLabel: '3 / 5',
  consentLabel: 'Aydınlatma onayı alındı',
  catalogCount: 10,
  deleteRequested: false,
  isPremium: false,
  planLabel: 'Premium aktif',
  onSignOut: jest.fn(),
  onRequestDelete: jest.fn(),
  onOpenPremium: jest.fn(),
  onOpenSettings: jest.fn(),
};

describe('ProfilePanel', () => {
  it('shows quota, consent, exam label, settings link — no inline switcher', () => {
    const onSignOut = jest.fn();
    const onRequestDelete = jest.fn();
    const onOpenPremium = jest.fn();
    const onOpenSettings = jest.fn();
    render(
      <ProfilePanel
        {...base}
        onSignOut={onSignOut}
        onRequestDelete={onRequestDelete}
        onOpenPremium={onOpenPremium}
        onOpenSettings={onOpenSettings}
      />,
    );

    expect(screen.getByTestId('profile-screen')).toBeTruthy();
    expect(screen.getByTestId('profile-quota')).toHaveTextContent(/3 \/ 5/);
    expect(screen.getByTestId('profile-consent')).toHaveTextContent(/Aydınlatma/);
    expect(screen.getByTestId('profile-exam')).toHaveTextContent(/YGS/);
    expect(screen.queryByTestId('exam-mode-switcher')).toBeNull();
    expect(screen.getByTestId('profile-change-exam')).toBeTruthy();

    fireEvent.press(screen.getByTestId('profile-change-exam'));
    expect(onOpenSettings).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('profile-settings-btn'));
    expect(onOpenSettings).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByTestId('profile-premium-card'));
    expect(onOpenPremium).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('profile-sign-out'));
    expect(onSignOut).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('profile-delete-request'));
    expect(onRequestDelete).toHaveBeenCalled();
  });

  it('shows pending delete flag instead of request button', () => {
    render(<ProfilePanel {...base} examType="lgs" deleteRequested />);
    expect(screen.getByTestId('profile-delete-pending')).toBeTruthy();
    expect(screen.queryByTestId('profile-delete-request')).toBeNull();
  });
});
