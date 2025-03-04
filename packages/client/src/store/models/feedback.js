import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken'; // Adjust the import path as needed
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  examples: null,
  status: 'idle',
  error: null,
};

export const findExamples = createThunkWithErrorHandling(
  'feedback/examples',
  async () => {
    const response = await fetchWithToken(`${BACKEND_URL}/feedback/examples`);
    const data = await response.json();
    return data
  }
);

export const sendFeedback = createThunkWithErrorHandling(
  'feedback/sendFeedback',
  async (data) => {
    const response = await fetchWithToken(`${BACKEND_URL}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const res = await response.json();
    return res
  },
);

// Slice
const feedbacksSlice = createSlice({
  name: 'feedbacks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(findExamples.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(findExamples.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.examples = action.payload;
      })
      .addCase(findExamples.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(sendFeedback.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(sendFeedback.fulfilled, (state, action) => {
        state.status = 'succeeded';
      })
      .addCase(sendFeedback.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
  },
});

export default feedbacksSlice.reducer;
