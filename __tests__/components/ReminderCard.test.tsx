import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ReminderCard } from '@components/ReminderCard';
import { Reminder } from '@types';
import { renderWithProviders } from '../../jest/test-utils';

const reminder: Reminder = {
  id: 'r1',
  title: 'Buy groceries',
  description: 'Milk and eggs',
  location: { latitude: 24.86, longitude: 67.0, address: 'City Supermarket' },
  radius: 250,
  status: 'pending',
  priority: 'medium',
  category: 'shopping',
  repeat: 'once',
  sound: 'default',
  enabled: true,
  createdAt: 1,
  updatedAt: 1,
};

describe('ReminderCard', () => {
  it('shows reminder details and toggles enabled state', async () => {
    const onToggleEnabled = jest.fn();
    const { getByText, getByRole } = await renderWithProviders(
      <ReminderCard reminder={reminder} onPress={jest.fn()} onToggleEnabled={onToggleEnabled} />,
    );

    expect(getByText('Buy groceries')).toBeOnTheScreen();
    expect(getByText('Milk and eggs')).toBeOnTheScreen();
    expect(getByText('City Supermarket')).toBeOnTheScreen();
    expect(getByText('250 m')).toBeOnTheScreen();
    expect(getByText('Pending')).toBeOnTheScreen();

    fireEvent(getByRole('switch'), 'valueChange', false);
    expect(onToggleEnabled).toHaveBeenCalledWith(false);
  });
});
