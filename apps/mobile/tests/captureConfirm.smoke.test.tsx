import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({
    uri: 'file:///tmp/q.jpg',
    mimeType: 'image/jpeg',
    source: 'camera',
    examType: 'lgs',
  }),
}));

import CaptureConfirmScreen from '@/app/capture-confirm';

describe('CaptureConfirmScreen', () => {
  it('shows crop corner guides on the preview frame', () => {
    render(<CaptureConfirmScreen />);
    expect(screen.getByTestId('capture-confirm')).toBeTruthy();
    expect(screen.getByTestId('capture-confirm-frame')).toBeTruthy();
    expect(screen.getByTestId('capture-crop-tl')).toBeTruthy();
    expect(screen.getByTestId('capture-crop-tr')).toBeTruthy();
    expect(screen.getByTestId('capture-crop-bl')).toBeTruthy();
    expect(screen.getByTestId('capture-crop-br')).toBeTruthy();
    expect(screen.getByTestId('capture-crop-hint')).toBeTruthy();
  });
});
