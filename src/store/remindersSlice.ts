import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Reminder, ReminderDraft, ReminderStatus } from '@types';
import { generateId } from '@utils';

export interface RemindersState {
  items: Reminder[];
}

const initialState: RemindersState = {
  items: [],
};

const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Reminder[]>) {
      state.items = action.payload;
    },
    addReminder: {
      reducer(state, action: PayloadAction<Reminder>) {
        state.items.unshift(action.payload);
      },
      prepare(draft: ReminderDraft) {
        const now = Date.now();
        const reminder: Reminder = {
          ...draft,
          id: generateId(),
          status: draft.enabled ? 'pending' : 'disabled',
          createdAt: now,
          updatedAt: now,
        };
        return { payload: reminder };
      },
    },
    updateReminder(
      state,
      action: PayloadAction<{ id: string; changes: Partial<Omit<Reminder, 'id' | 'createdAt'>> }>,
    ) {
      const reminder = state.items.find(r => r.id === action.payload.id);
      if (reminder) {
        Object.assign(reminder, action.payload.changes, { updatedAt: Date.now() });
      }
    },
    setReminderStatus(state, action: PayloadAction<{ id: string; status: ReminderStatus }>) {
      const reminder = state.items.find(r => r.id === action.payload.id);
      if (reminder) {
        reminder.status = action.payload.status;
        reminder.enabled = action.payload.status === 'pending';
        reminder.updatedAt = Date.now();
      }
    },
    markTriggered(state, action: PayloadAction<{ id: string; at: number }>) {
      const reminder = state.items.find(r => r.id === action.payload.id);
      if (reminder) {
        reminder.lastTriggeredAt = action.payload.at;
        if (reminder.repeat === 'once') {
          reminder.status = 'completed';
          reminder.enabled = false;
        }
        reminder.updatedAt = Date.now();
      }
    },
    deleteReminder(state, action: PayloadAction<string>) {
      state.items = state.items.filter(r => r.id !== action.payload);
    },
  },
});

export const {
  hydrate,
  addReminder,
  updateReminder,
  setReminderStatus,
  markTriggered,
  deleteReminder,
} = remindersSlice.actions;

export default remindersSlice.reducer;
