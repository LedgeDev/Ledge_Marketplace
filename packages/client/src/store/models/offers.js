import { createSlice } from '@reduxjs/toolkit';
import fetchWithToken from '../fetchWithToken';
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
import { setBoolInStorage } from '../../utils/check-bool-from-storage';
const BACKEND_URL = process.env.BACKEND_URL;

const initialState = {
  status: 'idle',
  error: null,
};

export const createOffer = createThunkWithErrorHandling(
  'offers/create',
  async (data, { dispatch }) => {
    const response = await fetchWithToken(`${BACKEND_URL}/offers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  },
);

// Slice
const offersSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createOffer.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createOffer.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(createOffer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default offersSlice.reducer;
