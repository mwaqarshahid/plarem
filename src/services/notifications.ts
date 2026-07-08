import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { NOTIFICATION_SOUNDS, NotificationSoundId, REMINDER_CHANNEL_ID } from '@constants';
import { Reminder } from '@types';

const SOUND_LABELS: Record<NotificationSoundId, string> = {
  default: 'Default',
  chime: 'Chime',
  bell: 'Bell',
};

const isKnownSound = (sound: string): sound is NotificationSoundId =>
  NOTIFICATION_SOUNDS.some(s => s.id === sound);

const createdChannels = new Set<string>();

/**
 * Android notification channels are immutable once created, so each tone gets
 * its own channel (e.g. "plarem-reminders-chime") with the sound baked in.
 * Custom tones live in android/app/src/main/res/raw/ (see scripts/generate-tones.js).
 */
const ensureChannel = async (sound: string): Promise<string> => {
  const soundId: NotificationSoundId = isKnownSound(sound) ? sound : 'default';
  const channelId = `${REMINDER_CHANNEL_ID}-${soundId}`;
  if (!createdChannels.has(channelId)) {
    await notifee.createChannel({
      id: channelId,
      name: `Location reminders (${SOUND_LABELS[soundId]})`,
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: soundId === 'default' ? 'default' : soundId,
    });
    createdChannels.add(channelId);
  }
  return channelId;
};

const iosSound = (sound: string): string =>
  sound === 'chime' || sound === 'bell' ? `${sound}.wav` : 'default';

/** Displays the "you have arrived" notification for a reminder. */
export const showArrivalNotification = async (reminder: Reminder): Promise<void> => {
  const channelId = await ensureChannel(reminder.sound);
  await notifee.displayNotification({
    id: reminder.id,
    title: reminder.title,
    body:
      reminder.description && reminder.description.length > 0
        ? reminder.description
        : `You have arrived near ${reminder.location.placeName ?? reminder.location.address}`,
    data: { reminderId: reminder.id },
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
      importance: AndroidImportance.HIGH,
      showTimestamp: true,
    },
    ios: {
      sound: iosSound(reminder.sound),
      interruptionLevel: 'timeSensitive',
    },
  });
};

/** Shows a test notification so the user can hear a tone (used by Settings). */
export const previewNotificationSound = async (sound: NotificationSoundId): Promise<void> => {
  const channelId = await ensureChannel(sound);
  await notifee.displayNotification({
    id: 'plarem-sound-preview',
    title: `${SOUND_LABELS[sound]} tone`,
    body: 'This is how arrival reminders will sound.',
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
      importance: AndroidImportance.HIGH,
    },
    ios: {
      sound: iosSound(sound),
    },
  });
};

type NotificationTapHandler = (reminderId: string) => void;

let tapHandler: NotificationTapHandler | undefined;
let pendingTapReminderId: string | undefined;

/**
 * Registers the handler that opens the reminder details screen. If a tap
 * arrived before navigation was ready, it is replayed immediately.
 */
export const setNotificationTapHandler = (handler: NotificationTapHandler): void => {
  tapHandler = handler;
  if (pendingTapReminderId) {
    handler(pendingTapReminderId);
    pendingTapReminderId = undefined;
  }
};

const handleTap = (reminderId: string | undefined): void => {
  if (!reminderId) {
    return;
  }
  if (tapHandler) {
    tapHandler(reminderId);
  } else {
    pendingTapReminderId = reminderId;
  }
};

/** Wires foreground/background notification tap events. Call once at startup. */
export const initNotificationEvents = (): void => {
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleTap(detail.notification?.data?.reminderId as string | undefined);
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleTap(detail.notification?.data?.reminderId as string | undefined);
    }
  });

  // App launched from a terminated state by tapping a notification.
  notifee.getInitialNotification().then(initial => {
    if (initial) {
      handleTap(initial.notification.data?.reminderId as string | undefined);
    }
  });
};
