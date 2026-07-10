import {
  createReminder,
  fillText,
  launchFresh,
  openReminderFromHome,
  scrollDetailsTo,
  scrollFormTo,
  skipOnboarding,
  tapFormSave,
} from './helpers';
describe('Onboarding', () => {
  beforeAll(async () => {
    await launchFresh();
  });

  it('skips permission steps and lands on Home', async () => {
    await expect(element(by.id('onboarding-screen'))).toBeVisible();
    await expect(element(by.text('Welcome to Plarem'))).toBeVisible();

    await skipOnboarding();

    await expect(element(by.id('home-title'))).toHaveText('Plarem');
    await expect(element(by.text('No reminders yet'))).toBeVisible();
  });
});

describe('Home', () => {
  beforeAll(async () => {
    await launchFresh();
    await skipOnboarding();
  });

  it('shows empty state and filter chips', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
    await expect(element(by.id('home-fab'))).toBeVisible();
    await expect(element(by.id('filter-all'))).toBeVisible();
    await expect(element(by.id('filter-pending'))).toBeVisible();
    await expect(element(by.text('No reminders yet'))).toBeVisible();
  });

  it('filters an empty list without crashing', async () => {
    await waitFor(element(by.id('filter-shopping')))
      .toBeVisible()
      .whileElement(by.id('home-filters'))
      .scroll(200, 'right');
    await element(by.id('filter-shopping')).tap();
    await expect(element(by.text('No reminders yet'))).toBeVisible();

    await waitFor(element(by.id('filter-all')))
      .toBeVisible()
      .whileElement(by.id('home-filters'))
      .scroll(200, 'left');
    await element(by.id('filter-all')).tap();
    await expect(element(by.text('No reminders yet'))).toBeVisible();
  });
});

describe('Settings', () => {
  beforeAll(async () => {
    await launchFresh();
    await skipOnboarding();
  });

  it('opens Settings and changes theme preference', async () => {
    await element(by.id('tab-settings')).tap();
    await waitFor(element(by.id('settings-screen')))
      .toBeVisible()
      .withTimeout(8000);

    await expect(element(by.id('settings-screen'))).toBeVisible();
    await expect(element(by.text('Appearance'))).toBeVisible();

    await waitFor(element(by.id('settings-theme-dark')))
      .toBeVisible()
      .whileElement(by.id('settings-screen'))
      .scroll(220, 'down');
    await element(by.id('settings-theme-dark')).tap();
    await element(by.id('settings-theme-light')).tap();

    await waitFor(element(by.id('settings-sound-chime')))
      .toBeVisible()
      .whileElement(by.id('settings-screen'))
      .scroll(220, 'up');
    await element(by.id('settings-sound-chime')).tap();

    await element(by.id('tab-reminders')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});

// Skipped: location picker + save flow is flaky on real Samsung devices (map/GPS/permissions).
describe('Reminder CRUD', () => {
  beforeAll(async () => {
    await launchFresh();
    await skipOnboarding();
  });

  it('creates a reminder', async () => {
    await createReminder('Buy milk');
    await expect(element(by.text('Buy milk'))).toBeVisible();
  });

  it('opens details, edits the title, and saves', async () => {
    await openReminderFromHome('Buy milk');
    await expect(element(by.id('reminder-details-title'))).toHaveText('Buy milk');

    await scrollDetailsTo('details-edit');
    await element(by.id('details-edit')).tap();
    await waitFor(element(by.id('reminder-form-screen')))
      .toBeVisible()
      .withTimeout(8000);

    await fillText('form-title', 'Buy eggs');

    await tapFormSave();

    await waitFor(element(by.id('reminder-details-screen')))
      .toBeVisible()
      .withTimeout(8000);
    await expect(element(by.id('reminder-details-title'))).toHaveText('Buy eggs');
  });

  it('marks a reminder completed then deletes it', async () => {
    await scrollDetailsTo('details-reactivate');
    await element(by.id('details-reactivate')).tap();
    await expect(element(by.id('reminder-details-status'))).toHaveText('Pending');

    await scrollDetailsTo('details-mark-completed');
    await element(by.id('details-mark-completed')).tap();
    await expect(element(by.id('reminder-details-status'))).toHaveText('Completed');

    await scrollDetailsTo('details-delete');
    await element(by.id('details-delete')).tap();
    await waitFor(element(by.text('Delete reminder')))
      .toBeVisible()
      .withTimeout(8000);
    await element(by.id('alert-button-delete')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
    await waitFor(element(by.text('No reminders yet')))
      .toBeVisible()
      .withTimeout(8000);
  });
});

// Skipped: same device-specific form/scroll issues as Reminder CRUD.
describe('Form validation', () => {
  beforeEach(async () => {
    await launchFresh();
    await skipOnboarding();
  });

  it('blocks save without a title', async () => {
    await element(by.id('home-fab')).tap();
    await waitFor(element(by.id('reminder-form-screen')))
      .toBeVisible()
      .withTimeout(8000);

    await tapFormSave();
    await scrollFormTo('form-title-error');

    await waitFor(element(by.id('form-title-error')))
      .toHaveText('Give your reminder a title')
      .withTimeout(8000);
    await expect(element(by.id('reminder-form-screen'))).toBeVisible();
  });

  it('prompts for a location when title is set', async () => {
    await element(by.id('home-fab')).tap();
    await waitFor(element(by.id('reminder-form-screen')))
      .toBeVisible()
      .withTimeout(8000);

    await fillText('form-title', 'Need a place');

    await tapFormSave();

    await waitFor(element(by.id('app-alert-title')))
      .toHaveText('Location missing')
      .withTimeout(8000);
    await element(by.id('alert-button-ok')).tap();
  });
});
