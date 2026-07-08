import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@theme';
import { AppSwitch } from '@components/AppSwitch';

const renderSwitch = async (
  props: React.ComponentProps<typeof AppSwitch>,
  theme: 'light' | 'dark' = 'light',
) =>
  render(
    <ThemeProvider preference={theme}>
      <AppSwitch testID="app-switch" {...props} />
    </ThemeProvider>,
  );

describe('AppSwitch', () => {
  it('renders on and off states', async () => {
    const { getByTestId, rerender } = await renderSwitch({ value: false, onValueChange: jest.fn() });
    expect(getByTestId('app-switch').props.value).toBe(false);

    await rerender(
      <ThemeProvider preference="light">
        <AppSwitch testID="app-switch" value onValueChange={jest.fn()} />
      </ThemeProvider>,
    );
    expect(getByTestId('app-switch').props.value).toBe(true);
  });

  it('calls onValueChange when toggled', async () => {
    const onValueChange = jest.fn();
    const { getByTestId } = await renderSwitch({ value: false, onValueChange });
    fireEvent(getByTestId('app-switch'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
