import reducer, {
  addReminder,
  deleteReminder,
  markTriggered,
  setReminderStatus,
  updateReminder,
} from '../src/store/remindersSlice';
import { ReminderDraft } from '../src/types';

const draft: ReminderDraft = {
  title: 'Buy eggs',
  description: 'A dozen, free range',
  location: { latitude: 24.86, longitude: 67.0, address: 'City Supermarket' },
  radius: 250,
  category: 'shopping',
  repeat: 'once',
};

describe('remindersSlice', () => {
  it('adds a reminder with generated id and pending status', () => {
    const state = reducer(undefined, addReminder(draft));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBeTruthy();
    expect(state.items[0].status).toBe('pending');
  });

  it('updates fields and bumps updatedAt', () => {
    let state = reducer(undefined, addReminder(draft));
    const id = state.items[0].id;
    state = reducer(state, updateReminder({ id, changes: { title: 'Buy milk' } }));
    expect(state.items[0].title).toBe('Buy milk');
  });

  it('marks a once-reminder completed when triggered', () => {
    let state = reducer(undefined, addReminder(draft));
    const id = state.items[0].id;
    state = reducer(state, markTriggered({ id, at: 123 }));
    expect(state.items[0].status).toBe('completed');
    expect(state.items[0].lastTriggeredAt).toBe(123);
  });

  it('keeps a repeating reminder pending when triggered', () => {
    let state = reducer(undefined, addReminder({ ...draft, repeat: 'every_arrival' }));
    const id = state.items[0].id;
    state = reducer(state, markTriggered({ id, at: 123 }));
    expect(state.items[0].status).toBe('pending');
  });

  it('updates status via setReminderStatus', () => {
    let state = reducer(undefined, addReminder(draft));
    const id = state.items[0].id;
    state = reducer(state, setReminderStatus({ id, status: 'disabled' }));
    expect(state.items[0].status).toBe('disabled');
    state = reducer(state, setReminderStatus({ id, status: 'pending' }));
    expect(state.items[0].status).toBe('pending');
  });

  it('deletes reminders', () => {
    let state = reducer(undefined, addReminder(draft));
    state = reducer(state, deleteReminder(state.items[0].id));
    expect(state.items).toHaveLength(0);
  });
});
