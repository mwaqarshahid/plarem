import { filterReminders } from '../src/store/selectors';
import { Reminder } from '../src/types';

const base: Omit<Reminder, 'id' | 'title' | 'category' | 'status'> = {
  description: undefined,
  location: { latitude: 24.86, longitude: 67.0, address: 'Main Street 1' },
  radius: 250,
  priority: 'medium',
  repeat: 'once',
  sound: 'default',
  enabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const reminders: Reminder[] = [
  { ...base, id: '1', title: 'Buy eggs', category: 'shopping', status: 'pending' },
  { ...base, id: '2', title: 'Submit report', category: 'office', status: 'completed' },
  {
    ...base,
    id: '3',
    title: 'Collect prescription',
    category: 'health',
    status: 'disabled',
    location: { latitude: 25.5, longitude: 68.0, address: 'Hospital Road' },
  },
];

describe('filterReminders', () => {
  it('matches search on title', () => {
    const result = filterReminders(reminders, { search: 'eggs', filter: 'all' });
    expect(result.map(r => r.id)).toEqual(['1']);
  });

  it('matches search on address', () => {
    const result = filterReminders(reminders, { search: 'hospital', filter: 'all' });
    expect(result.map(r => r.id)).toEqual(['3']);
  });

  it('matches search on category label', () => {
    const result = filterReminders(reminders, { search: 'office', filter: 'all' });
    expect(result.map(r => r.id)).toEqual(['2']);
  });

  it('filters by status', () => {
    expect(
      filterReminders(reminders, { search: '', filter: 'completed' }).map(r => r.id),
    ).toEqual(['2']);
    expect(
      filterReminders(reminders, { search: '', filter: 'disabled' }).map(r => r.id),
    ).toEqual(['3']);
  });

  it('filters by category', () => {
    expect(
      filterReminders(reminders, { search: '', filter: 'shopping' }).map(r => r.id),
    ).toEqual(['1']);
  });

  it('filters nearby by user location', () => {
    const result = filterReminders(reminders, {
      search: '',
      filter: 'nearby',
      userLocation: { latitude: 24.861, longitude: 67.001 },
    });
    expect(result.map(r => r.id)).toEqual(['1', '2']);
  });

  it('returns nothing for nearby without a location', () => {
    expect(filterReminders(reminders, { search: '', filter: 'nearby' })).toEqual([]);
  });
});
