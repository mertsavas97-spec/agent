import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfilePanel } from '@/src/features/profile/ProfilePanel';

const base = {
  examType: 'ygs' as const,
  onExamChange: jest.fn(),
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
  it('shows quota, consent, exam switcher, settings, premium, sign-out and delete', () => {
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
    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
    expect(screen.getByTestId('profile-settings-btn')).toBeTruthy();
    expect(screen.getByTestId('profile-premium-card')).toBeTruthy();

    fireEvent.press(screen.getByTestId('profile-settings-btn'));
    expect(onOpenSettings).toHaveBeenCalled();
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

  it('shows active premium copy on card', () => {
    render(
      <ProfilePanel
        {...base}
        isPremium
        planLabel="Yıllık plan · 279 TL / yıl"
      />,
    );
    expect(screen.getByTestId('profile-premium-card')).toHaveTextContent(/PREMİUM AKTİF/);
    expect(screen.getByTestId('profile-premium-card')).toHaveTextContent(/279 TL/);
  });
});
