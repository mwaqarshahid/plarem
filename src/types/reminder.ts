export type ReminderStatus = 'pending' | 'completed' | 'skipped' | 'disabled' | 'expired';

export type ReminderRepeat = 'once' | 'every_arrival';

export type CategoryId =
  | 'shopping'
  | 'personal'
  | 'office'
  | 'health'
  | 'travel'
  | 'bills'
  | 'friends'
  | 'family'
  | 'custom';

export interface ReminderLocation {
  latitude: number;
  longitude: number;
  /** Human-readable address or place name. */
  address: string;
  /** Optional short place name (e.g. "City Supermarket"). */
  placeName?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  location: ReminderLocation;
  /** Geofence radius in meters. */
  radius: number;
  status: ReminderStatus;
  category: CategoryId;
  /** Custom category label when category === 'custom'. */
  customCategory?: string;
  repeat: ReminderRepeat;
  /** Epoch ms. */
  createdAt: number;
  updatedAt: number;
  /** Epoch ms of the last time the geofence fired for this reminder. */
  lastTriggeredAt?: number;
  /** Optional expiry (epoch ms); reminder becomes 'expired' after this. */
  expiresAt?: number;
}

export type ReminderDraft = Omit<
  Reminder,
  'id' | 'status' | 'createdAt' | 'updatedAt' | 'lastTriggeredAt'
>;
