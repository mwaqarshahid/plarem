import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { REMINDER_CHANNEL_ID } from '@constants';
import { Reminder } from '@types';

let channelCreated = false;

const ensureChannel = async (): Promise<string> => {
  if (!channelCreated) {
    await notifee.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Location reminders',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
    channelCreated = true;
  }
  return REMINDER_CHANNEL_ID;
};

/** Displays the "you have arrived" notification for a reminder. */
export const showArrivalNotification = async (reminder: Reminder): Promise<void> => {
  const channelId = await ensureChannel();
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
      sound: 'default',
      interruptionLevel: 'timeSensitive',
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
