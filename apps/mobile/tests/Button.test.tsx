import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@/src/ui/Button';

jest.mock('@/src/ui/haptics', () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
  hapticSelection: jest.fn(),
}));

describe('Button', () => {
  it('fires onPress for primary CTA', () => {
    const onPress = jest.fn();
    render(<Button label="Devam" onPress={onPress} testID="btn-primary" />);
    fireEvent.press(screen.getByTestId('btn-primary'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(
      <Button label="Kapalı" onPress={onPress} disabled testID="btn-disabled" />,
    );
    fireEvent.press(screen.getByTestId('btn-disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
