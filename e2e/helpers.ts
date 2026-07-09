/** Shared Detox helpers for Plarem E2E suites. */
import { execSync } from 'child_process';

const ANDROID_PACKAGE = 'com.plarem';

export const skipOnboarding = async (): Promise<void> => {
  await waitFor(element(by.id('onboarding-continue')))
    .toBeVisible()
    .withTimeout(15000);

  await element(by.id('onboarding-continue')).tap();
  await element(by.id('onboarding-skip-location')).tap();
  await element(by.id('onboarding-skip-background')).tap();
  await element(by.id('onboarding-skip-notifications')).tap();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(10000);
};

export const launchFresh = async (): Promise<void> => {
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
  grantAndroidPermissions();
};

const getAdbSerial = (): string | undefined =>
  process.env.ANDROID_SERIAL || device.id || 'R5CR11BAHBR';

/** Grant runtime permissions so enabled reminders can save without system dialogs. */
export const grantAndroidPermissions = (): void => {
  if (device.getPlatform() !== 'android') {
    return;
  }

  const serial = getAdbSerial();
  const adb = serial ? `adb -s ${serial}` : 'adb';
  const permissions = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.POST_NOTIFICATIONS',
  ];

  for (const permission of permissions) {
    try {
      execSync(`${adb} shell pm grant ${ANDROID_PACKAGE} ${permission}`, { stdio: 'ignore' });
    } catch {
      // Ignore grant failures on older API levels or already-granted permissions.
    }
  }
};

export const openCreateReminder = async (): Promise<void> => {
  await element(by.id('home-fab')).tap();
  await waitFor(element(by.id('reminder-form-screen')))
    .toBeVisible()
    .withTimeout(8000);
};

export const scrollFormTo = async (testID: string): Promise<void> => {
  const target = element(by.id(testID));
  const scrollView = element(by.id('reminder-form-screen'));

  try {
    await waitFor(target).toBeVisible().withTimeout(1500);
    return;
  } catch {
    // Keep scrolling until the target is on screen.
  }

  for (let attempt = 0; attempt < 14; attempt += 1) {
    try {
      await waitFor(target).toBeVisible().withTimeout(600);
      return;
    } catch {
      await scrollView.scroll(380, attempt < 8 ? 'down' : 'up', 0.5, 0.5);
    }
  }

  await waitFor(target).toBeVisible().withTimeout(8000);
};

export const scrollDetailsTo = async (testID: string): Promise<void> => {
  const target = element(by.id(testID));
  const scrollView = element(by.id('reminder-details-screen'));

  try {
    await waitFor(target).toBeVisible().withTimeout(1500);
    return;
  } catch {
    // Keep scrolling until the target is on screen.
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      await waitFor(target).toBeVisible().withTimeout(600);
      return;
    } catch {
      await scrollView.scroll(320, attempt < 7 ? 'down' : 'up', 0.5, 0.5);
    }
  }

  await waitFor(target).toBeVisible().withTimeout(8000);
};

export const openReminderFromHome = async (title: string): Promise<void> => {
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(8000);
  await waitFor(element(by.text(title)))
    .toBeVisible()
    .withTimeout(8000);
  await element(by.text(title)).tap();
  await waitFor(element(by.id('reminder-details-screen')))
    .toBeVisible()
    .withTimeout(8000);
};

export const createReminderWithDemoLocation = async (): Promise<void> => {
  await openCreateReminder();
  await scrollFormTo('form-e2e-create-buy-milk');
  await element(by.id('form-e2e-create-buy-milk')).tap();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(15000);
  await waitFor(element(by.text('Buy milk')))
    .toBeVisible()
    .withTimeout(8000);
};
