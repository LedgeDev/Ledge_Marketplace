import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken';
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  events: [],
  status: 'idle',
  error: null,
};

export const sendEvents = createThunkWithErrorHandling(
  'events/send',
  async (_, { getState }) => {
    const data = getState().events.events;
    const response = await fetchWithToken(`${BACKEND_URL}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  },
);

// Slice
const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    addEvent: (state, action) => {
      const event = action.payload;
      state.events.push(event);
      console.log('event added', event);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendEvents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(sendEvents.fulfilled, (state) => {
        state.status = 'succeeded';
        state.events = [];
      })
      .addCase(sendEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
  },
});

export const {
  addEvent,
} = eventsSlice.actions;
export default eventsSlice.reducer;
