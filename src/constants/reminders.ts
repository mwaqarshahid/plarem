import { ReminderStatus } from '@types';
import { BRAND } from './brand';

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

export const STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  skipped: 'Skipped',
  disabled: 'Disabled',
  expired: 'Expired',
};

export const STATUS_COLORS: Record<ReminderStatus, string> = {
  pending: BRAND.arrow,
  completed: '#5B8C1A',
  skipped: '#C4A014',
  disabled: BRAND.tileLight,
  expired: '#C94B5A',
};
