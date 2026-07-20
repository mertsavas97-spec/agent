import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { CozbilRobot } from '@/src/ui/CozbilRobot';

describe('CozbilRobot', () => {
  it('renders with stable testID for both tones', () => {
    const { rerender } = render(
      <CozbilRobot size={40} tone="onLight" testID="robot-a" />,
    );
    expect(screen.getByTestId('robot-a')).toBeTruthy();
    rerender(<CozbilRobot size={56} tone="onDark" testID="robot-a" />);
    expect(screen.getByTestId('robot-a')).toBeTruthy();
  });

  it('accepts legacy variant prop as tone alias', () => {
    render(<CozbilRobot variant="onLight" testID="robot-legacy" />);
    expect(screen.getByTestId('robot-legacy')).toBeTruthy();
  });
});
