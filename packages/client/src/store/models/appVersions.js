import { createSlice } from '@reduxjs/toolkit';
import Constants from 'expo-constants';
import { createThunkWithErrorHandling } from '../createThunkWithErrorHandling';
import fetchWithToken from '../fetchWithToken';
const BACKEND_URL = process.env.BACKEND_URL;
const APP_VERSION = Constants.expoConfig.version;

const initialState = {
  versionInfo: null,
  status: 'idle',
  error: null,
};

// Async thunk for fetching app version
export const fetchAppVersion = createThunkWithErrorHandling(
  'appVersions/fetchAppVersion',
  async () => {
    const response = await fetchWithToken(
      `${BACKEND_URL}/app-versions?version=${encodeURIComponent(APP_VERSION)}`,
    );
    return await response.json();
  },
);

// Slice
const appVersionsSlice = createSlice({
  name: 'appVersions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppVersion.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAppVersion.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.versionInfo = action.payload.versionInfo;
      })
      .addCase(fetchAppVersion.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default appVersionsSlice.reducer;
