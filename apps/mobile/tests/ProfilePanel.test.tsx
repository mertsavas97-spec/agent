import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfilePanel } from '@/src/features/profile/ProfilePanel';

describe('ProfilePanel', () => {
  it('shows quota, consent, exam switcher, sign-out and delete request', () => {
    const onSignOut = jest.fn();
    const onRequestDelete = jest.fn();
    const onExamChange = jest.fn();
    render(
      <ProfilePanel
        examType="ygs"
        onExamChange={onExamChange}
        quotaLabel="3 / 5"
        consentLabel="Aydınlatma onayı alındı"
        catalogCount={10}
        deleteRequested={false}
        onSignOut={onSignOut}
        onRequestDelete={onRequestDelete}
      />,
    );

    expect(screen.getByTestId('profile-screen')).toBeTruthy();
    expect(screen.getByTestId('profile-quota')).toHaveTextContent(/3 \/ 5/);
    expect(screen.getByTestId('profile-consent')).toHaveTextContent(/Aydınlatma/);
    expect(screen.getByTestId('exam-mode-switcher')).toBeTruthy();
    fireEvent.press(screen.getByTestId('profile-sign-out'));
    expect(onSignOut).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('profile-delete-request'));
    expect(onRequestDelete).toHaveBeenCalled();
  });

  it('shows pending delete flag instead of request button', () => {
    render(
      <ProfilePanel
        examType="lgs"
        onExamChange={jest.fn()}
        quotaLabel="5 / 5"
        consentLabel="Veli / yaşa uygun onay alındı"
        catalogCount={10}
        deleteRequested
        onSignOut={jest.fn()}
        onRequestDelete={jest.fn()}
      />,
    );
    expect(screen.getByTestId('profile-delete-pending')).toBeTruthy();
    expect(screen.queryByTestId('profile-delete-request')).toBeNull();
  });
});
