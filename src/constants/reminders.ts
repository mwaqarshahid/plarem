import { ReminderPriority, ReminderStatus } from '@types';

export const RADIUS_PRESETS = [100, 250, 500, 1000] as const;

export const MIN_RADIUS_METERS = 50;
export const MAX_RADIUS_METERS = 10000;
export const DEFAULT_RADIUS_METERS = 250;

export const NOTIFICATION_SOUNDS = [
  { id: 'default', label: 'Default' },
  { id: 'chime', label: 'Chime' },
  { id: 'bell', label: 'Bell' },
] as const;

export type NotificationSoundId = (typeof NOTIFICATION_SOUNDS)[number]['id'];

export const PRIORITIES: { id: ReminderPriority; label: string; color: string }[] = [
  { id: 'low', label: 'Low', color: '#1F9D5B' },
  { id: 'medium', label: 'Medium', color: '#E8930C' },
  { id: 'high', label: 'High', color: '#DC3A45' },
];

export const STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  skipped: 'Skipped',
  disabled: 'Disabled',
  expired: 'Expired',
};

export const STATUS_COLORS: Record<ReminderStatus, string> = {
  pending: '#4F5BE8',
  completed: '#1F9D5B',
  skipped: '#E8930C',
  disabled: '#5C6070',
  expired: '#DC3A45',
};
