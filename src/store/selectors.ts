import { createSelector } from '@reduxjs/toolkit';
import { getCategoryMeta } from '@constants';
import { Reminder } from '@types';
import { distanceMeters, isToday } from '@utils';
import type { RootState } from './index';

export type FilterId =
  | 'all'
  | 'today'
  | 'nearby'
  | 'completed'
  | 'pending'
  | 'shopping'
  | 'office'
  | 'disabled';

export const selectReminders = (state: RootState): Reminder[] => state.reminders.items;

export const selectReminderById = (id: string) =>
  createSelector(selectReminders, items => items.find(r => r.id === id));

const NEARBY_THRESHOLD_M = 2000;

export interface ReminderQuery {
  search: string;
  filter: FilterId;
  userLocation?: { latitude: number; longitude: number };
}

const matchesSearch = (reminder: Reminder, term: string): boolean => {
  const q = term.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const categoryLabel =
    reminder.category === 'custom' && reminder.customCategory
      ? reminder.customCategory
      : getCategoryMeta(reminder.category).label;
  return (
    reminder.title.toLowerCase().includes(q) ||
    (reminder.description ?? '').toLowerCase().includes(q) ||
    reminder.location.address.toLowerCase().includes(q) ||
    (reminder.location.placeName ?? '').toLowerCase().includes(q) ||
    categoryLabel.toLowerCase().includes(q) ||
    reminder.status.toLowerCase().includes(q)
  );
};

const matchesFilter = (reminder: Reminder, query: ReminderQuery): boolean => {
  switch (query.filter) {
    case 'all':
      return true;
    case 'today':
      return (
        (reminder.lastTriggeredAt !== undefined && isToday(reminder.lastTriggeredAt)) ||
        isToday(reminder.createdAt)
      );
    case 'nearby': {
      const loc = query.userLocation;
      if (!loc) {
        return false;
      }
      return (
        distanceMeters(
          loc.latitude,
          loc.longitude,
          reminder.location.latitude,
          reminder.location.longitude,
        ) <= NEARBY_THRESHOLD_M
      );
    }
    case 'completed':
      return reminder.status === 'completed';
    case 'pending':
      return reminder.status === 'pending';
    case 'disabled':
      return reminder.status === 'disabled';
    case 'shopping':
      return reminder.category === 'shopping';
    case 'office':
      return reminder.category === 'office';
    default:
      return true;
  }
};

export const filterReminders = (items: Reminder[], query: ReminderQuery): Reminder[] =>
  items.filter(r => matchesSearch(r, query.search) && matchesFilter(r, query));
